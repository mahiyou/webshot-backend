import {IsUrl} from 'class-validator';

export class CaptureRequest { 
    @IsUrl()
    url: string;
    viewportWidth: string = '1200';
    viewportHeight: string = '800';
    width: string;
    crop: string;
    fullPage: boolean = false;
    type: string = 'jpg';
    wait: string = '0';
    maxAge: string = '0';
}