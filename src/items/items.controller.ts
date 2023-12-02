import { Controller, Get, Res, Query, UsePipes, ValidationPipe, Req, Param, All } from '@nestjs/common';
import { Response } from 'express';
import { CaptureRequest } from './dto/CaptureRequest.dto';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { stat } from "fs/promises";
import * as mime from 'mime';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Item } from './interfaces/item.interface';
import puppeteer from 'puppeteer';
import { v4 as uuid } from 'uuid';
import * as sharp from 'sharp';
import * as fs from 'fs';
import { inherits } from 'util';

@Controller()
export class ItemsController {
    constructor(@InjectModel('images') private readonly itemModel: Model<Item>) { }

    @Get("capture")
    @UsePipes(new ValidationPipe({ transform: true }))
    async capture(@Query() query: CaptureRequest, @Res() res: Response) {
        const imageName = uuid();
        this.getScreenShot(query, imageName)
            .then(async () => {
                const image = path.resolve(__dirname, "..", "..", "public", "images", `${imageName}.${query.type}`);
                const file = createReadStream(image);
                const webSiteUrl = query.url;
                const newItem = new this.itemModel({ image: `${imageName}.${query.type}`, webSiteUrl })
                newItem.save();
                const imageStat = await stat(image);
                res.set({
                    'Content-Type': (mime as any).getType(image),
                    'Content-Length': imageStat.size,
                });
                // file.pipe(res);
                sharp(image)
                    .resize(query.width ? parseInt(`${query.width}`) : undefined ,query.crop ? parseInt(`${query.crop}`) : undefined)
                    .pipe(res)



            },
                (error) => {
                    console.log(error)
                }
            )
    }

    private async getScreenShot(query: CaptureRequest, imageName: string) {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({
            width: parseInt(`${query.viewportWidth}`),
            height: parseInt(`${query.viewportHeight}`),
        });
        await page.goto(query.url);
        await page.screenshot({
            path: `${__dirname}/../../public/images/${imageName}.${query.type}`, fullPage: query.fullPage
        });
        await browser.close();
    }

    @Get("gallery/:count")
    getImages(@Param('count') count) {
        return this.itemModel.find().sort({ _id: -1 }).limit(count);
    }

    @Get(':filename')
    findFile(@Param('filename') filename, @Res() res: Response) {
        res.sendFile(filename, { root: './public/images' })
    }

}