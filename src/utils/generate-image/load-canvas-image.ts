import { Image, loadImage } from 'canvas';

export default (image: string | Buffer): Promise<Image> => loadImage(image);
