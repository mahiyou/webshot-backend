import { Controller, Get, Res, Query, UsePipes, ValidationPipe, Req, Param } from '@nestjs/common';
import { Response } from 'express';
import { CaptureRequest } from './dto/CaptureRequest.dto';
import * as path from 'path';
import { createReadStream } from 'fs';
import { stat } from "fs/promises";
import * as mime from 'mime';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Item } from './interfaces/item.interface';

@Controller()
export class ItemsController {
    constructor(@InjectModel('images') private readonly itemModel: Model<Item>) { }

    @Get("capture")
    @UsePipes(new ValidationPipe({ transform: true }))
    async capture(@Query() query: CaptureRequest, @Res() res: Response, @Req() req: Request) {

        const image = path.resolve(__dirname, "..", "..", "public", "images", "w3.jpg");

        const webSiteUrl = query.url;
        const newItem = new this.itemModel({ image:"mokasarat.jpg",webSiteUrl })
        newItem.save();

        const file = createReadStream(image);
        const imageStat = await stat(image);
        res.set({
            'Content-Type': (mime as any).getType(image),
            'Content-Length': imageStat.size,
        });
        file.pipe(res);
    }

    @Get("gallery")
    getImages() {
        return this.itemModel.find();
    }

    @Get(':filename')
    findFile(@Param('filename') filename, @Res() res: Response) {
        res.sendFile(filename, {root: './public/images'})
    }

}