import { ObjectId } from "mongoose";

export interface Item {
    _id: ObjectId
    image: string;
    webSiteUrl: string;
    saveTime: string;
}
