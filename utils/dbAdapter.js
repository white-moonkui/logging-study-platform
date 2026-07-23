/**
 * 数据库适配器
 * 统一处理内存数据库和MongoDB的接口差异
 */

// 检查是否使用内存数据库
const isMemoryDB = () => {
    const uri = process.env.MONGODB_URI;
    return uri && uri.startsWith('memory://');
};

class DatabaseAdapter {
    constructor() {
        this.isMemory = isMemoryDB();
    }

    // 获取模型
    getModel(name, schema) {
        if (this.isMemory) {
            return this.getMemoryModel(name, schema);
        } else {
            // 延迟导入 mongoose
            const mongoose = require('mongoose');
            return mongoose.model(name, schema);
        }
    }

    // 获取内存数据库模型
    getMemoryModel(name, schema) {
        const memoryDBModule = require('./memoryDB');
        const memoryDB = memoryDBModule.memoryDB;

        // 内存查询类，支持链式调用
        class MemoryQuery {
            constructor(docs = []) {
                this._docs = docs;
                this._filter = {};
                this._sort = null;
                this._limit = 0;
                this._skip = 0;
                this._populate = [];
            }

            populate(path, select) {
                // 简化实现：记录需要 populate 的字段，但不实际执行
                this._populate.push({ path, select });
                return this;
            }

            sort(sortBy) {
                this._sort = sortBy;
                return this;
            }

            limit(n) {
                this._limit = n;
                return this;
            }

            skip(n) {
                this._skip = n;
                return this;
            }

            select(fields) {
                // 简化实现：忽略 select
                return this;
            }

            async exec() {
                let docs = [...this._docs];

                // 应用过滤
                if (Object.keys(this._filter).length > 0) {
                    docs = docs.filter(doc => this._matchesFilter(doc, this._filter));
                }

                // 应用排序
                if (this._sort) {
                    const keys = Object.keys(this._sort);
                    if (keys.length > 0) {
                        const key = keys[0];
                        const order = this._sort[key];
                        docs.sort((a, b) => {
                            const aVal = a[key];
                            const bVal = b[key];
                            if (order === 1) {return aVal > bVal ? 1 : -1;}
                            return aVal < bVal ? 1 : -1;
                        });
                    }
                }

                // 应用分页
                const total = docs.length;
                docs = docs.slice(this._skip, this._skip + (this._limit || total));

                return docs;
            }

            _matchesFilter(doc, filter) {
                if (filter.$or) {
                    return filter.$or.some(condition => this._matchesFilter(doc, condition));
                }
                // 支持 $in 操作符
                if (filter.$in) {
                    const [key, values] = Object.entries(filter.$in)[0] || [];
                    if (key && Array.isArray(values)) {
                        return values.includes(doc[key]);
                    }
                }
                for (const [key, value] of Object.entries(filter)) {
                    if (key === '$in' || key === '$or') {continue;}
                    if (doc[key] !== value) {return false;}
                }
                return true;
            }

            then(resolve, reject) {
                this.exec().then(resolve, reject);
            }
        }

        // 为内存数据库创建一个模拟的Mongoose Model
        class MemoryModel {
            constructor(data) {
                Object.assign(this, data);
                this._id = data._id || Date.now() + Math.random();
                // 应用Schema默认值
                if (schema && schema.paths) {
                    // 先收集所有顶层路径的默认值
                    for (const [path, schemaType] of Object.entries(schema.paths)) {
                        if (!path.includes('.') && schemaType.defaultValue !== undefined && this[path] === undefined) {
                            this[path] = schemaType.defaultValue;
                        }
                    }
                    // 对展开为子路径的嵌套对象（如 learningProgress.basicKnowledge），重建顶层对象
                    const nestedObjects = new Set();
                    for (const [path, schemaType] of Object.entries(schema.paths)) {
                        if (path.includes('.') && schemaType.defaultValue !== undefined) {
                            const parentKey = path.split('.')[0];
                            if (this[parentKey] === undefined) {
                                nestedObjects.add(parentKey);
                            }
                        }
                    }
                    // 为嵌套对象构建默认值对象
                    for (const parentKey of nestedObjects) {
                        const obj = {};
                        for (const [path, schemaType] of Object.entries(schema.paths)) {
                            if (path.startsWith(`${parentKey  }.`) && schemaType.defaultValue !== undefined) {
                                const subKey = path.slice(parentKey.length + 1);
                                obj[subKey] = schemaType.defaultValue;
                            }
                        }
                        if (Object.keys(obj).length > 0) {
                            this[parentKey] = obj;
                        }
                    }
                }
            }

            toObject() {
                return { ...this };
            }

            static aggregate(pipeline) {
                const collection = memoryDB.getCollection(name);
                return collection.aggregate(pipeline);
            }

            static async findOne(filter) {
                const collection = memoryDB.getCollection(name);
                const doc = await collection.findOne(filter);
                if (!doc) {return null;}
                const model = new MemoryModel(doc);
                model._id = doc._id;
                return model;
            }

            static findById(id) {
                const collection = memoryDB.getCollection(name);
                const promise = collection.findOne({ _id: parseFloat(id) || id }).then(doc => {
                    if (!doc) {return null;}
                    const model = new MemoryModel(doc);
                    model._id = doc._id;
                    return model;
                });

                // 返回支持链式调用的包装对象（thenable，类似 Mongoose Query）
                const wrapper = {
                    _promise: promise,
                    select (fields) {
                        return this;
                    },
                    populate (path, select) {
                        return this;
                    },
                    then (resolve, reject) {
                        return promise.then(resolve, reject);
                    },
                };
                return wrapper;
            }

            static async findByIdAndDelete(id) {
                const collection = memoryDB.getCollection(name);
                const doc = await collection.findOne({ _id: parseFloat(id) || id });
                if (doc) {
                    await collection.deleteOne({ _id: doc._id });
                }
                return doc;
            }

            static async countDocuments(filter = {}) {
                const collection = memoryDB.getCollection(name);
                const docs = await collection.find(filter);
                return docs.length;
            }

            static find(filter) {
                const collection = memoryDB.getCollection(name);
                // 返回 MemoryQuery 对象，支持链式调用
                const query = new MemoryQuery();
                query._filter = filter;
                query._docs = []; // 延迟加载
                query._getDocs = async () => {
                    if (query._docs.length === 0) {
                        const docs = await collection.find(filter);
                        query._docs = docs.map(doc => {
                            const model = new MemoryModel(doc);
                            model._id = doc._id;
                            return model;
                        });
                    }
                    return query._docs;
                };

                // 覆盖方法以使用延迟加载
                const originalExec = query.exec.bind(query);
                query.exec = async function () {
                    const docs = await this._getDocs();
                    this._docs = docs;
                    return originalExec();
                };

                const originalThen = query.then.bind(query);
                query.then = function (resolve, reject) {
                    this.exec().then(resolve, reject);
                };

                return query;
            }

            static async countDocuments(filter = {}) {
                const docs = await this.find(filter);
                return docs.length;
            }

            static async deleteMany(filter = {}) {
                const collection = memoryDB.getCollection(name);
                let count = 0;
                const MAX_ITERATIONS = 10000; // 最大迭代次数保护，防止无限循环
                let iterations = 0;

                while (iterations < MAX_ITERATIONS) {
                    const result = await collection.deleteOne(filter);
                    if (result.deletedCount === 0) {break;}
                    count += result.deletedCount;
                    iterations++;

                    // 防止主线程阻塞，每1000次让出一次
                    if (iterations % 1000 === 0) {
                        await new Promise(resolve => setImmediate(resolve));
                    }
                }

                if (iterations >= MAX_ITERATIONS) {
                    console.warn(
                        `deleteMany达到最大迭代次数限制(${MAX_ITERATIONS})，可能存在数据未完全删除`
                    );
                }

                return { deletedCount: count };
            }

            async save() {
                const collection = memoryDB.getCollection(name);

                // 检查是否已存在
                const existingDoc = await collection.findOne({ _id: this._id });

                if (!existingDoc) {
                    const inserted = await collection.insertOne(this.toObject());
                    // 同步文档真正的 _id（insertOne 用自增 id 覆盖了原 _id）
                    this._id = inserted._id;
                } else {
                    await collection.updateOne({ _id: this._id }, this.toObject());
                }

                return this;
            }

            toObject() {
                return { ...this };
            }

            static async create(data) {
                const model = new MemoryModel(data);
                await model.save();
                return model;
            }
        }

        return MemoryModel;
    }

    // 连接数据库
    async connect() {
        if (this.isMemory) {
            const memoryDBModule = require('./memoryDB');
            await memoryDBModule.memoryDB.connect();
        } else {
            // 延迟导入 mongoose，仅在需要时加载
            const mongoose = require('mongoose');
            await mongoose.connect(
                process.env.MONGODB_URI || 'mongodb://localhost:27017/well_logging_training',
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                }
            );
        }
    }

    // 断开连接
    async disconnect() {
        if (this.isMemory) {
            const memoryDBModule = require('./memoryDB');
            await memoryDBModule.memoryDB.disconnect();
        } else {
            const mongoose = require('mongoose');
            await mongoose.disconnect();
        }
    }
}

// 创建适配器实例
const dbAdapter = new DatabaseAdapter();

module.exports = dbAdapter;
