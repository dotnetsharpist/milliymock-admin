export type language = 'Uzbek' | 'Russian';

export interface Translation {
    id: number;
    language: language;
    text: string;
    imagePath: string;
}