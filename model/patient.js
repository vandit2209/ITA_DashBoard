const mongoose = require("mongoose")

const patientDetail = new mongoose.Schema({
    cur_problem: {
        type: Array,
        default: null,
        trim: true
    },
    past_problem: {
        type: Array,
        default: null,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    sex: {
        type: String,
        enum: ['M','F','Others'],
        required: true
    },


})