/**
 * 内存数据库模拟器
 * 用于开发和测试环境，替代真实的MongoDB
 */

const EventEmitter = require('events');

class MemoryDatabase extends EventEmitter {
    constructor() {
        super();
        this.collections = new Map();
        this.connected = false;
    }

    // 连接数据库
    async connect() {
        this.connected = true;
        this.emit('connected');
        console.log('内存数据库已连接');
    }

    // 断开连接
    async disconnect() {
        this.connected = false;
        this.emit('disconnected');
        console.log('内存数据库已断开');
    }

    // 获取集合
    getCollection(name) {
        if (!this.collections.has(name)) {
            this.collections.set(name, new MemoryCollection());
        }
        return this.collections.get(name);
    }

    // 重置所有数据（清空所有集合）
    async reset() {
        this.collections.clear();
    }

    // 模拟 Mongoose model 注册
    model(name, schema) {
        if (!this.models) {this.models = new Map();}
        if (!this.models.has(name)) {
            this.models.set(name, schema);
        }
        return this.getCollection(name);
    }
}

// 内存查询类

class MemoryCollection {
    constructor(schema) {
        this.documents = [];
        this.nextId = 1;
        this.schema = schema || {};
    }

    // 插入文档
    async insertOne(doc) {
        const document = {
            ...doc,
            _id: this.nextId++,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.documents.push(document);
        return document;
    }

    // 查找文档
    async find(filter = {}) {
        return this.documents.filter(doc => this.matchesFilter(doc, filter));
    }

    // 查找一个文档
    async findOne(filter = {}) {
        const docs = await this.find(filter);
        return docs.length > 0 ? docs[0] : null;
    }

    // 更新文档
    async updateOne(filter, update) {
        const doc = await this.findOne(filter);
        if (doc) {
            Object.assign(doc, update, { updatedAt: new Date() });
            return { matchedCount: 1, modifiedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
    }

    // 删除文档
    async deleteOne(filter) {
        const index = this.documents.findIndex(doc => this.matchesFilter(doc, filter));
        if (index !== -1) {
            this.documents.splice(index, 1);
            return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
    }

    // 过滤匹配
    matchesFilter(doc, filter) {
        if (Object.keys(filter).length === 0) {return true;}

        // 处理 $or 操作符
        if (filter.$or) {
            return filter.$or.some(condition => this.matchesFilter(doc, condition));
        }

        for (const [key, value] of Object.entries(filter)) {
            if (doc[key] !== value) {return false;}
        }
        return true;
    }

    // 分页查询
    async paginate(filter = {}, options = {}) {
        const { page = 1, limit = 10, sort = {} } = options;
        const docs = await this.find(filter);

        // 简单排序
        if (Object.keys(sort).length > 0) {
            const [sortKey, sortOrder] = Object.entries(sort)[0];
            docs.sort((a, b) => {
                return sortOrder === 1
                    ? a[sortKey] > b[sortKey]
                        ? 1
                        : -1
                    : a[sortKey] < b[sortKey]
                      ? 1
                      : -1;
            });
        }

        const total = docs.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedDocs = docs.slice(startIndex, endIndex);

        return {
            docs: paginatedDocs,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }

    // 统计文档数量
    async countDocuments(filter = {}) {
        return this.documents.filter(doc => this.matchesFilter(doc, filter)).length;
    }

    // 聚合查询（简化实现，支持 $match + $group）
    async aggregate(pipeline) {
        let docs = [...this.documents];

        for (const stage of pipeline) {
            if (stage.$match) {
                docs = docs.filter(doc => this.matchesFilter(doc, stage.$match));
            } else if (stage.$group) {
                const { _id, ...accumulators } = stage.$group;
                const groups = new Map();

                // 分组键提取函数
                const getGroupKey = (doc) => {
                    if (_id === null) {return '__global__';}
                    if (typeof _id === 'string') {
                        return doc[_id] ?? '__null__';
                    }
                    if (typeof _id === 'object' && _id !== null) {
                        const key = {};
                        for (const [alias, field] of Object.entries(_id)) {
                            key[alias] = doc[field.replace(/^\$/, '')];
                        }
                        return JSON.stringify(key);
                    }
                    return '__global__';
                };

                for (const doc of docs) {
                    const key = getGroupKey(doc);
                    if (!groups.has(key)) {groups.set(key, { _id: key === '__global__' ? null : key });}

                    const group = groups.get(key);
                    for (const [field, expr] of Object.entries(accumulators)) {
                        if (!expr.$sum && !expr.$avg && !expr.$min && !expr.$max) {continue;}

                        if (!group[field]) {
                            if (expr.$sum !== undefined) {group[field] = 0;}
                            if (expr.$avg !== undefined) {group[field] = 0;}
                            if (expr.$min !== undefined) {group[field] = Infinity;}
                            if (expr.$max !== undefined) {group[field] = -Infinity;}
                        }

                        // 解析值（支持 $cond 操作符）
                        const getValue = (valExpr, doc) => {
                            if (typeof valExpr === 'object' && valExpr !== null && valExpr.$cond) {
                                const { if: ifCond, then: thenVal, else: elseVal } = valExpr.$cond;
                                const conditionMet = (() => {
                                    if (typeof ifCond === 'object' && ifCond.$gte) {
                                        const [fieldExpr, threshold] = ifCond.$gte;
                                        const fieldName = fieldExpr.replace(/^\$/, '');
                                        return (doc[fieldName] ?? 0) >= threshold;
                                    }
                                    return false;
                                })();
                                return conditionMet ? 1 : 0;
                            }
                            if (typeof valExpr === 'string' && valExpr.startsWith('$')) {
                                return doc[valExpr.slice(1)] ?? 0;
                            }
                            return valExpr ?? 0;
                        };

                        if (expr.$sum !== undefined) {
                            group[field] += getValue(expr.$sum, doc);
                        }
                        if (expr.$avg !== undefined) {
                            group._avgCount = (group._avgCount || 0) + 1;
                            group._avgSum = (group._avgSum || 0) + getValue(expr.$avg, doc);
                        }
                        if (expr.$min !== undefined) {
                            const val = getValue(expr.$min, doc);
                            if (val < group[field]) {group[field] = val;}
                        }
                        if (expr.$max !== undefined) {
                            const val = getValue(expr.$max, doc);
                            if (val > group[field]) {group[field] = val;}
                        }
                    }
                }

                // 计算平均值
                for (const group of groups.values()) {
                    for (const field of Object.keys(accumulators)) {
                        if (accumulators[field].$avg !== undefined) {
                            group[field] = (group._avgSum || 0) / (group._avgCount || 1);
                            delete group._avgCount;
                            delete group._avgSum;
                        }
                    }
                }

                docs = Array.from(groups.values());
            }
        }

        return docs;
    }
}

// 创建内存数据库实例
// (instance creation moved below the class)

// 创建内存数据库实例
const memoryDB = new MemoryDatabase();

// 模拟Mongoose
const mockMongoose = {
    connect: async uri => {
        await memoryDB.connect();
        return Promise.resolve();
    },
    disconnect: async () => {
        await memoryDB.disconnect();
        return Promise.resolve();
    },
    connection: {
        on: (event, callback) => {
            memoryDB.on(event, callback);
        },
        once: (event, callback) => {
            memoryDB.once(event, callback);
        },
    },
    Schema: class Schema {
        constructor(schema) {
            this.schema = schema;
        }
    },
    model: (name, schema) => {
        return memoryDB.model(name, schema);
    },
};

// 导出内存数据库实例和模拟Mongoose
module.exports = mockMongoose;
module.exports.memoryDB = memoryDB;
