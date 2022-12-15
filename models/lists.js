const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const List = mongoose.Schema({
    user: { type: String, required: true },
    name: { type: String, unique: true, required: true },
    items: { type: Array, required: true }
});

List.plugin(passportLocalMongoose);