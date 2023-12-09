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
import { loadImage, createCanvas, PNGStream } from 'canvas';
import * as fs from 'fs'
import { Readable } from 'stream';

@Controller()
export class ItemsController {
    constructor(@InjectModel('images') private readonly itemModel: Model<Item>) { }

    private async sendImage(res: Response, image: fs.ReadStream | Readable | string, contentType?: string) {
        let size: number;
        if (typeof image === "string") {
            contentType = (mime as any).getType(image);
            size = (await stat(image)).size;
            image = createReadStream(image);
        }
        if (contentType) {
            res.set("Content-Type", contentType);
        }
        if (size) {
            res.set("Content-Length", size.toString());
        }
        image.pipe(res);
    }

    @Get("capture")
    @UsePipes(new ValidationPipe({ transform: true }))
    async capture(@Query() query: CaptureRequest, @Res() res: Response) {
        const recentData = await this.itemModel.findOne({ 
            webSiteUrl: query.url,
            saveTime: {
                $gt: Date.now() - (parseInt(query.maxAge) * 1000)
            }
        });
        if (recentData) {
            this.sendImage(res, `${__dirname}/../../public/images/${recentData.image}`);
            return;
        }
          
        const imageName = uuid();
        try {
            const image = await this.getScreenShot(query, imageName);
            const newItem = new this.itemModel({ image: path.basename(image), webSiteUrl: query.url, saveTime: Date.now() })
            await newItem.save();


            if (query.crop || query.width) {
                const imageWidth = (await sharp(image).metadata()).width;
                const imageStream = sharp(image).extract({
                    height: parseInt(query.crop) ? parseInt(query.crop) : 800,
                    left: 0,
                    top: 0,
                    width: imageWidth
                })
                    .resize({ width: parseInt(query.width) ? parseInt(query.width) : 1200 });
                
                this.sendImage(res, imageStream, (mime as any).getType(image));
            } else {
                this.sendImage(res, image);
            }
        } catch (error) {
            const canvas = createCanvas(700, 500)
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "red";
            ctx.font = '18px Sans'

            ctx.fillText(error, 10, 100)

            this.sendImage(res, canvas.createPNGStream(), "image/png");

        }
    }

    private async getScreenShot(query: CaptureRequest, imageName: string) {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({
            width: parseInt(`${query.viewportWidth}`),
            height: parseInt(`${query.viewportHeight}`),
        });
        try {
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
        catch (error) {
            await browser.close();
            throw new Error(error);
        }

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