import { Controller, Get, Res, Query, UsePipes, ValidationPipe, Param } from '@nestjs/common';
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
import * as sharp from 'sharp';
import { MongoClient } from 'mongodb';

@Controller()
export class ItemsController {
    constructor(@InjectModel('images') private readonly itemModel: Model<Item>) { }

    @Get("capture")
    @UsePipes(new ValidationPipe({ transform: true }))
    async capture(@Query() query: CaptureRequest, @Res() res: Response) {
        const recentData = (await this.findRecentRecords(query.maxAge))
        if (recentData.length > 0) {
            const result = recentData.find(({ webSiteUrl }) => webSiteUrl === query.url)
            if (result) {
                const image = `${__dirname}/../../public/images/${result.image}`
                console.log(result.image)
                const file = createReadStream(image);
                const imageStat = await stat(image);
                res.set({
                    'Content-Type': (mime as any).getType(image),
                    'Content-Length': imageStat.size,
                });
                if (query.crop || query.width) {
                    const imageWidth = (await sharp(image).metadata()).width
                    sharp(image).extract({
                        height: parseInt(query.crop) ? parseInt(query.crop) : 800,
                        left: 0,
                        top: 0,
                        width: imageWidth
                    })
                        .resize({ width: parseInt(query.width) ? parseInt(query.width) : 1200 })
                        .pipe(res)
                } else {
                    file.pipe(res)
                }

            } else {
                const imageName = uuid();
                try {
                    const image = await this.getScreenShot(query, imageName);
                    const file = createReadStream(image);
                    const webSiteUrl = query.url;
                    const newItem = new this.itemModel({ image: path.basename(image), webSiteUrl, saveTime: Date.now() })
                    newItem.save();
                    const imageStat = await stat(image);
                    res.set({
                        'Content-Type': (mime as any).getType(image),
                        'Content-Length': imageStat.size,
                    });
                    // pipe(res);
                    if (query.crop || query.width) {
                        const imageWidth = (await sharp(image).metadata()).width
                        sharp(image).extract({
                            height: parseInt(query.crop) ? parseInt(query.crop) : 800,
                            left: 0,
                            top: 0,
                            width: imageWidth
                        })
                            .resize({ width: parseInt(query.width) ? parseInt(query.width) : 1200 })
                            .pipe(res)
                    } else {
                        file.pipe(res)
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        } else {
            const imageName = uuid();
            try {
                const image = await this.getScreenShot(query, imageName);
                const file = createReadStream(image);
                const webSiteUrl = query.url;
                const newItem = new this.itemModel({ image: path.basename(image), webSiteUrl, saveTime: Date.now() })
                newItem.save();
                const imageStat = await stat(image);
                res.set({
                    'Content-Type': (mime as any).getType(image),
                    'Content-Length': imageStat.size,
                });
                // pipe(res);
                if (query.crop || query.width) {
                    const imageWidth = (await sharp(image).metadata()).width
                    sharp(image).extract({
                        height: parseInt(query.crop) ? parseInt(query.crop) : 800,
                        left: 0,
                        top: 0,
                        width: imageWidth
                    })
                        .resize({ width: parseInt(query.width) ? parseInt(query.width) : 1200 })
                        .pipe(res)
                } else {
                    file.pipe(res)
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    private async getScreenShot(query: CaptureRequest, imageName: string) {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({
            width: parseInt(`${query.viewportWidth}`),
            height: parseInt(`${query.viewportHeight}`),
        });
        await page.goto(query.url);
        await new Promise((resolve) => setTimeout(resolve, parseInt(query.wait) * 1000));
        const path = `${__dirname}/../../public/images/${imageName}.${query.type}`;
        await page.screenshot({
            path,
            fullPage: query.fullPage
        });
        await browser.close();
        return path;
    }
    private findRecentRecords(maxAge: string) {
        return this.itemModel.find({ saveTime: { $gt: (Date.now() - (parseInt(maxAge) * 1000)) } })
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