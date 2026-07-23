const dbAdapter = require('../utils/dbAdapter');

// 延迟导入 mongoose，仅在需要时加载
let mongoose;
const getMongoose = () => {
    if (!mongoose) {
        mongoose = require('mongoose');
    }
    return mongoose;
};

const categorySchema = new (getMongoose().Schema)(
    {
        name: { type: String, required: true, maxlength: 100 },
        code: { type: String, required: true, unique: true, maxlength: 50 },
        parentId: { type: String, ref: 'Category' },
        level: { type: Number, required: true, default: 1, min: 1 },
        sortOrder: { type: Number, default: 0 },
        icon: { type: String, maxlength: 50 },
    },
    {
        timestamps: true,
        collection: 'categories',
    }
);

module.exports = dbAdapter.getModel('Category', categorySchema);
