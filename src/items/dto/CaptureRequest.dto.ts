import {IsUrl} from 'class-validator';

export class CaptureRequest { 
    @IsUrl()
    url: string;
    viewportWidth: number = 1200;
    viewportHeight: number = 800;
    width: number;
    crop: number;
    fullPage: boolean = false;
    type: string = 'jpg';
}