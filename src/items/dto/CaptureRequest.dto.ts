import {IsUrl} from 'class-validator';

export class CaptureRequest { 
    @IsUrl()
    url: string;
    webSiteUrl: string;
}