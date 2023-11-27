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
import puppeteer from 'puppeteer';
import { v4 as uuid } from 'uuid';

@Controller()
export class ItemsController {
    constructor(@InjectModel('images') private readonly itemModel: Model<Item>) { }

    @Get("capture")
    @UsePipes(new ValidationPipe({ transform: true }))
    async capture(@Query() query: CaptureRequest, @Res() res: Response) {
        const imageName = uuid();

        this.getScreenShot(query, imageName).then(async () => {
            const image = path.resolve(__dirname, "..", "..", "public", "images", `${imageName}.jpg`);
            const webSiteUrl = query.url;
            const newItem = new this.itemModel({ image: `${imageName}.jpg`, webSiteUrl })
            newItem.save();
            // const file = createReadStream(image);
            const imageStat = await stat(image);
            res.set({
                'Content-Type': (mime as any).getType(image),
                'Content-Length': imageStat.size,
            });
            // file.pipe(res);
        })
    }

    async getScreenShot(query, imageName) {
        const browser = await puppeteer.launch({ product: 'firefox' });
        const page = await browser.newPage();
        console.log(query.url)
        await page.goto(query.url);
        await page.screenshot({ path: `public/images/${imageName}.jpg` });
        await browser.close();
    }

    @Get("gallery")
    getImages() {
        return this.itemModel.find();
    }

    @Get(':filename')
    findFile(@Param('filename') filename, @Res() res: Response) {
        res.sendFile(filename, { root: './public/images' })
    }

}