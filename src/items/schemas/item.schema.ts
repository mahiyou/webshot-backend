import * as mongoose from 'mongoose';

export const ItemSchema = new mongoose.Schema({
    image: String,
    webSiteUrl: String,
    saveTime: String
})