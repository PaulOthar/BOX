class BinaryUnit{
    name;
    type;
    data;

    width;
    height;

    constructor(){
        this.name = new String();
        this.type = BinaryUnit.binaryType.BIN;
        this.data = null;
        
        this.width = 0;
        this.height = 0;
    }

    setName(name){
        this.name = name.slice(0, 8).toUpperCase();
    }

    static binaryType = {
        BIN: 'BIN\0\0\0\0\0',
        IMG_1BPP: "IMG_1\0\0\0",
        IMG_4BPP: "IMG_4\0\0\0",
        IMG_8BPP: "IMG_8\0\0\0",
        IMG_24BPP: "IMG_24\0\0",
        IMG_32BPP: "IMG_32\0\0",
    };

    toString(){
        let extraText = new String();
        switch(this.type){
            case BinaryUnit.binaryType.IMG_1BPP:
            case BinaryUnit.binaryType.IMG_4BPP:
            case BinaryUnit.binaryType.IMG_8BPP:
            case BinaryUnit.binaryType.IMG_24BPP:
            case BinaryUnit.binaryType.IMG_32BPP:
                extraText = `(${this.width}, ${this.height})`
                break;
        }
        return `${this.name} [ ${this.type}${extraText} (${this.data.length}B)]`;
    }
}

class FileDisplay{
    fileUnit;
    hexadecimal;
    text;
    image;

    page;
    
    static pageSize = 1 << 15;

    static nibblePalette = [
        0x000000,0x111111,0x818181,0xffffff,
        0xff0000,0xaa0000,0x550000,0x2a0000,
        0x00ff00,0x00aa00,0x005500,0x002a00,
        0x00ffff,0x00aaaa,0x005555,0x002a2a
    ];

    constructor(){
        this.fileUnit = null;
        this.hexadecimal = new String();
        this.text = new String();
        this.image = null;
        this.page = 0;
    }

    clear(){
        this.fileUnit = null;
        this.hexadecimal = new String();
        this.text = new String();
        this.image = null;
        this.page = 0;
    }

    loadBinary(binaryUnit){
        if(binaryUnit == this.fileUnit){ return; }
        this.fileUnit = binaryUnit;
        
        this.page = 0;
        
        this.updatePage();

        switch(binaryUnit.type){
            case BinaryUnit.binaryType.IMG_1BPP: this.image = FileDisplay.buildImage_1BPP(binaryUnit); break;
            case BinaryUnit.binaryType.IMG_4BPP: this.image = FileDisplay.buildImage_4BPP(binaryUnit); break;
            case BinaryUnit.binaryType.IMG_8BPP: this.image = FileDisplay.buildImage_8BPP(binaryUnit); break;
            case BinaryUnit.binaryType.IMG_24BPP: this.image = FileDisplay.buildImage_24BPP(binaryUnit); break;
            case BinaryUnit.binaryType.IMG_32BPP: this.image = FileDisplay.buildImage_32BPP(binaryUnit); break;
            default: this.image = FileDisplay.buildImage_Default(binaryUnit); break;
        }
    }

    updatePage(){
        let start = (FileDisplay.pageSize * this.page);
        let limit = (FileDisplay.pageSize * (this.page + 1));

        this.text = new String();
        this.hexadecimal = new String();
        for(let i = start; i<this.fileUnit.data.length && i < limit; i++){
            let byte = this.fileUnit.data[i];

            //Text writting
            this.text += String.fromCharCode(byte);

            //Hexadecimal writting
            if((i & 0x7) == 0){
                if(i > start){ this.hexadecimal += "\n"; }
                this.hexadecimal += "[";
                for(let l = 0; l < 8; l++){ this.hexadecimal += ((i >> ((7-l) * 4)) & 0xf).toString(16); }
                this.hexadecimal += "]";
            }
            this.hexadecimal += " "
            this.hexadecimal += (byte >> 4).toString(16);
            this.hexadecimal += (byte & 0xf).toString(16);
        }
    }

    nextPage(){
        if(this.fileUnit == null){ return; }
        let currentPageByte = this.page * FileDisplay.pageSize;
        if((currentPageByte + FileDisplay.pageSize) > this.fileUnit.data.length){ return; }
        this.page++;
        this.updatePage();
    }

    previousPage(){
        if(this.fileUnit == null){ return; }
        if(this.page == 0){ return; }
        this.page--;
        this.updatePage();
    }

    getMaxPage(){
        return Math.ceil(this.fileUnit.data.length / FileDisplay.pageSize) - 1;
    }

    static buildImage_1BPP(binaryUnit){
        let image = new ImageData(binaryUnit.width, binaryUnit.height);

        for(let i = 0; i < binaryUnit.data.length; i++){
            for(let l = 0; l < 8; l++){
                let color = ((binaryUnit.data[i] >> (7-l)) & 1) > 0 ? 0xff : 0x00;
                let index = ((i * 8) + l) * 4;
                image.data[index] = color;
                image.data[index + 1] = color;
                image.data[index + 2] = color;
                image.data[index + 3] = color;
            }
        }
        return image;
    }

    static buildImage_4BPP(binaryUnit){
        let image = new ImageData(binaryUnit.width, binaryUnit.height);

        for(let i = 0; i < binaryUnit.data.length; i++){
            let nibble = (binaryUnit.data[i] >> 4) & 0xf;
            let color = FileDisplay.nibblePalette[nibble];
            let index = i * 8;
            image.data[index] = (color >> 16) & 0xff;
            image.data[index + 1] = (color >> 8) & 0xff;
            image.data[index + 2] = color & 0xff;
            image.data[index + 3] = color > 0 ? 0xff : 0;

            nibble = binaryUnit.data[i] & 0xf;
            color = FileDisplay.nibblePalette[nibble];
            image.data[index + 4] = (color >> 16) & 0xff;
            image.data[index + 5] = (color >> 8) & 0xff;
            image.data[index + 6] = color & 0xff;
            image.data[index + 7] = color > 0 ? 0xff : 0;
        }

        return image;
    }

    static buildImage_8BPP(binaryUnit){//grayscale
        let image = new ImageData(binaryUnit.width, binaryUnit.height);

        for(let i = 0; i < this.data.length; i++){
            let index = i * 4;
            let color = binaryUnit.data[i];
            image.data[index] = color;
            image.data[index + 1] = color;
            image.data[index + 2] = color;
            image.data[index + 3] = 0xff;
        }

        return image;
    }

    static buildImage_24BPP(binaryUnit){
        let image = new ImageData(binaryUnit.width,binaryUnit.height);

        for(let i = 0, l = 0; l < binaryUnit.data.length; i += 4, l += 3){
            image.data[i] = binaryUnit.data[l];//r
            image.data[i + 1] = binaryUnit.data[l + 1];//g
            image.data[i + 2] = binaryUnit.data[l + 2];//b
            image.data[i + 3] = 0xff;//a
        }

        return image;
    }

    static buildImage_32BPP(binaryUnit){
        let image = new ImageData(binaryUnit.width,binaryUnit.height);

        for(let i = 0; i < binaryUnit.data.length; i += 4){
            image.data[i] = binaryUnit.data[i + 1];//r
            image.data[i + 1] = binaryUnit.data[i + 2];//g
            image.data[i + 2] = binaryUnit.data[i + 3];//b
            image.data[i + 3] = binaryUnit.data[i];//a
        }

        return image;
    }

    static buildImage_Default(binaryUnit){
        let size = Math.ceil(binaryUnit.data.length / 3);
        let oldWidth = binaryUnit.width;
        let oldHeight = binaryUnit.height;

        binaryUnit.width = Math.floor(Math.sqrt(size));
        binaryUnit.height = Math.ceil(size / binaryUnit.width);

        let result = FileDisplay.buildImage_24BPP(binaryUnit);

        binaryUnit.width = oldWidth;
        binaryUnit.height = oldHeight;

        return result;
    }
}

class FileParser{
    static auxiliaryCanvas = FileParser._createAuxiliaryCanvas();
    static auxiliaryInput = FileParser._createAuxiliaryInput();

    static _createAuxiliaryCanvas(){
        let canvas = document.createElement("canvas");;
        return canvas;
    }

    static _createAuxiliaryInput(){
        let input = document.createElement("input");
        input.type = "file"
        input.multiple = true;
        return input;
    }

    static async requestFiles(){
        const result = await new Promise((resolve, reject) => {
            FileParser.auxiliaryInput.onchange = () => {
                resolve(FileParser.auxiliaryInput.files);
                FileParser.auxiliaryInput.onchange = null;
            };
            FileParser.auxiliaryInput.value = "";
            FileParser.auxiliaryInput.click();
        });
        return result;
    }

    static async parseFile(file){
        let result = new BinaryUnit();
        result.setName(file.name.split('.')[0]);

        if(file.type.startsWith("image")){ await FileParser.parseImage(file, result); }
        else{ await FileParser.parseBinary(file, result); }

        return result;
    }

    static async requestParsedFiles(){
        let files = await FileParser.requestFiles();

        let parsedFiles = new Array();
        for(let i = 0; i < files.length; i++){
            parsedFiles.push(await FileParser.parseFile(files[i]));
        }

        return parsedFiles;
    }

    static convertImageToImageData(image){
        FileParser.auxiliaryCanvas.width = image.width;
        FileParser.auxiliaryCanvas.height = image.height;
        let ctx = FileParser.auxiliaryCanvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, image.width, image.height);
    }

    static async getFileBytes(file){
        const result = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => { resolve(new Uint8Array(reader.result)); };
            reader.onerror = () => { reject(reader.error); };
            reader.readAsArrayBuffer(file);
        });
        return result;
    }

    static async getFileURL(file){
        const result = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => { resolve(reader.result); };
            reader.onerror = () => { reject(reader.error); };
            reader.readAsDataURL(file);
        });
        return result;
    }

    static async getImage(file){
        let src = await FileParser.getFileURL(file);
        const result = await new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = () => { resolve( image ); }
            image.onerror = () => { reject( new Image(0,0)); }
            image.src = src;
        });
        return result;
    }

    static async parseBinary(file, binaryResult){
        binaryResult.type = BinaryUnit.binaryType.BIN;//Useless if this is a new file.
        binaryResult.data = await FileParser.getFileBytes(file);
    }

    static async parseImage(file, binaryResult){
        let imageData = FileParser.convertImageToImageData( await FileParser.getImage(file) );
        binaryResult.type = BinaryUnit.binaryType.IMG_32BPP;
        binaryResult.width = imageData.width;
        binaryResult.height = imageData.height;

        
        //ImageData = RGBA
        //Correct   = ARGB
        let correctedData = new Uint8Array(imageData.data.length);
        for(let i = 0;i<imageData.data.length;i += 4){
            correctedData[i] = imageData.data[i + 3];
            correctedData[i + 1] = imageData.data[i];
            correctedData[i + 2] = imageData.data[i + 1];
            correctedData[i + 3] = imageData.data[i + 2];
        }
        binaryResult.data = correctedData;

        if(file.type.endsWith("bmp")){ await FileParser.parseBitmap(file, binaryResult); return; }
    }

    static async parseBitmap(file, binaryResult){
        let bytes = await FileParser.getFileBytes(file);
        let bitsPerPixel = bytes[28];
        switch( bitsPerPixel ){
            case 1: binaryResult.type = BinaryUnit.binaryType.IMG_1BPP; break;
            case 4: binaryResult.type = BinaryUnit.binaryType.IMG_4BPP; break;
            case 8: binaryResult.type = BinaryUnit.binaryType.IMG_8BPP; break;
            case 24: binaryResult.type = BinaryUnit.binaryType.IMG_24BPP;
                let newPixelStructure = new Uint8Array( (binaryResult.data.length / 4) * 3 );
                for(let i = 1, l = 0; i<binaryResult.data.length; i += 4, l += 3){
                    newPixelStructure[l] = binaryResult.data[i];
                    newPixelStructure[l + 1] = binaryResult.data[i + 1];
                    newPixelStructure[l + 2] = binaryResult.data[i + 2];
                }
                binaryResult.data = newPixelStructure;
                //Then it leaks to the default return.
            default: return;
        }

        //Fetching Bitmap Palette
        let bitmapPaletteOffset = bytes[14] + 14;
        let paletteSize = 1  << (bitsPerPixel /*Bits Per Pixel*/);
        let paletteMaximumRange = (paletteSize * 4) + bitmapPaletteOffset;
        let extractedPalette = new Uint32Array((paletteMaximumRange - bitmapPaletteOffset) / 4);
        for(let i = bitmapPaletteOffset, l = 0; i < paletteMaximumRange ; i += 4, l++){
            for(let k = 0; k < 3; k++){//BMP palette is made with BGRA instead of ARGB
                extractedPalette[l] |= bytes[i + k] << (k * 8);
            }
        }

        //Converting each pixel into an index
        let indices = new Uint8Array( binaryResult.data.length / 4 );//ARGB -> Index(0-255)
        for(let i = 0, l = 0; i<binaryResult.data.length; i += 4, l++){
            let color = 0;
            for(let k = 1; k < 4; k++){//ignoring the first byte, since it its the alpha.
                color = (color << 8) | binaryResult.data[i + k];
            }
            indices[l] = extractedPalette.indexOf(color);
        }

        //Compressing each index to its ideal size
        let shrinked = new Uint8Array( (indices.length * bitsPerPixel) >> 3);
        for(let i = 0; i<indices.length; i++){
            let shrinkIndex = (i * bitsPerPixel) >> 3;
            shrinked[shrinkIndex] = (shrinked[shrinkIndex] << bitsPerPixel) | indices[i];
        }

        binaryResult.data = shrinked;
    }
}

class FileSelectionList{
    display;
    selectedIndex;
    fileList;

    constructor(){
        this.display = new FileDisplay();
        this.selectedIndex = 0;
        this.fileList = new Array();
    }

    selectFile(index){
        if(index < 0 || index >= this.fileList.length){ return; }
        this.selectedIndex = index;
        this.display.loadBinary(this.fileList[index]);
    }

    async includeFiles(){
        let parsedFiles = await FileParser.requestParsedFiles();
        let newIndex = this.selectedIndex + parsedFiles.length - (this.fileList.length == 0 ? 1 : 0);
        this.fileList.splice(this.selectedIndex + 1, 0, ...parsedFiles);
        this.selectedIndex = newIndex;
        this.selectFile(this.selectedIndex);
    }

    removeSelected(){
        if(this.fileList.length == 0){ return; }
        this.fileList.splice(this.selectedIndex, 1);
        if(this.fileList.length == 0){ this.display.clear(); }
        if(this.selectedIndex > 0 && this.selectedIndex >= this.fileList.length){ this.selectedIndex--; }
        this.selectFile(this.selectedIndex);
    }

    moveFileUp(index){
        if(index == 0){ return; }
        let selected = this.fileList[index];
        this.fileList[index] = this.fileList[index - 1];
        this.fileList[index - 1] = selected;
        if(index == this.selectedIndex){ this.selectedIndex--; }
        else if((index - 1) == this.selectedIndex){ this.selectedIndex++; }
    }

    moveFileDown(index){
        if(index >= (this.fileList.length - 1)){ return; }
        let selected = this.fileList[index];
        this.fileList[index] = this.fileList[index + 1];
        this.fileList[index + 1] = selected;
        if(index == this.selectedIndex){ this.selectedIndex++; }
        else if((index + 1) == this.selectedIndex){ this.selectedIndex--; }
    }

    getFilesIdentity(){
        let result = new Array();
        for(let i = 0; i < this.fileList.length; i++){
            result.push(this.fileList[i].toString());
        }
        return result;
    }
}

class BoxParser{
    static encodeNumber(number, bytes){
        let encoded = new Uint8Array(bytes);
        for(let i = 0; i < bytes; i++){
            let shift = (bytes - 1 - i) * 8;
            encoded[i] = (number >> shift) & 0xff;
        }
        return encoded;
    }

    static encodeString(string, bytes){
        let encoded = new Uint8Array(bytes);
        let encoder = new TextEncoder();
        let text = encoder.encode(string);

        for(let i = 0; i < bytes; i++){
            if(i >= text.length){
                encoded[i] = 0;
                continue;
            }
            encoded[i] = text[i];
        }

        return encoded;
    }

    static decodeString(stream, bytes, index){
        let result = new String();
        for(let i = index; i < (bytes + index) && i < stream.length; i++){
            result += String.fromCharCode(stream[i]);
        }
        return result;
    }

    static decodeNumber(stream, bytes, index){
        let result = 0;
        for(let i = index; i < (bytes + index) && i < stream.length; i++){
            result = (result << 8) | stream[i];
        }
        return result;
    }

    static encodeDate(){
        let date32 = 0;
        let now = new Date();
        date32 = now.getFullYear();
        date32 = (date32 << 4) | (now.getMonth() + 1);
        date32 = (date32 << 5) | (now.getDate());
        date32 = (date32 << 5) | (now.getHours());
        date32 = (date32 << 6) | (now.getMinutes());

        return BoxParser.encodeNumber(date32,4);
    }

    static createBinary(binaryUnitList){
        let binaryResult = new Array();

        //File format name (4B)
        binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeString("BOX ", 4));//Magic name

        //File entry size (4B)
        binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeNumber(binaryUnitList.length, 4));

        //File entry offset (4B) (later modified)
        binaryResult.push(0, 0, 0, 0);

        //Date (4B)
        binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeDate());
        
        let totalSize = 16;
        let offsets = new Array();
        for(let i = 0; i < binaryUnitList.length; i++){
            offsets.push(totalSize);
            totalSize += binaryUnitList[i].data.length;
            //binaryResult.splice(binaryResult.length, 0, ...binaryUnitList[i].data);
            for(let l = 0; l < binaryUnitList[i].data.length; l++){
                binaryResult.push(binaryUnitList[i].data[l]);
            }
        }

        //File entry offset rewritting
        binaryResult.splice(8, 4, ...BoxParser.encodeNumber(totalSize, 4));

        //File header creation
        for(let i = 0; i < binaryUnitList.length; i++){
            let file = binaryUnitList[i];
            binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeString(file.name, 8));
            binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeString(file.type, 8));
            binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeNumber(file.width, 4));
            binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeNumber(file.height, 4));
            binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeNumber(file.data.length, 4));
            binaryResult.splice(binaryResult.length, 0, ...BoxParser.encodeNumber(offsets[i], 4));
        }

        return new Uint8Array(binaryResult);
    }

    static parseBinaryBox(bytes){
        let name = BoxParser.decodeString(bytes, 4, 0);
        if(name != "BOX "){
            console.error(`Invalid file format ${name}`);
            return;
        }
        let entrySize = BoxParser.decodeNumber(bytes, 4, 4);
        let offset = BoxParser.decodeNumber(bytes, 4, 8);
        let files = new Array();
        for(let i = 0; i < entrySize; i++){
            let index = offset + (i * 32);

            let unit = new BinaryUnit();

            unit.name = BoxParser.decodeString(bytes, 8, index);
            unit.type = BoxParser.decodeString(bytes, 8, index + 8);

            unit.width = BoxParser.decodeNumber(bytes, 4, index + 16);
            unit.height = BoxParser.decodeNumber(bytes, 4, index + 20);

            let fileSize = BoxParser.decodeNumber(bytes, 4, index + 24);
            let fileOffset = BoxParser.decodeNumber(bytes, 4, index + 28);
            
            let fileData = new Uint8Array(fileSize);
            for(let l = 0; l < fileSize; l++){
                fileData[l] = bytes[l + fileOffset];
            }
            unit.data = fileData;

            files.push(unit);
        }

        return files;
    }
}

//----------------Graphics + systems----------------

class GraphicSystem{
    elementMap;
    actionMap;
    valueMap;

    constructor(){
        this.elementMap = new Map();
        this.actionMap = new Map();
        this.valueMap = new Map();
    }

    putElement(elementId, key){
        let element = document.getElementById(elementId);
        this.elementMap.set(key, element);
    }

    putAction(key, actionFunction){//Seems pointless
        this.actionMap.set(key, actionFunction);
    }

    putValue(key, value){//Seems pointless
        this.valueMap.set(key, value);
    }

    getElement(key){//Seems pointless
        return this.elementMap.get(key);
    }

    getAction(key){//Seems pointless
        return this.actionMap.get(key);
    }

    getValue(key){//Seems pointless
        return this.valueMap.get(key);
    }

    playAction(key, content){
        const context = this;
        if(!this.actionMap.get(key)){ console.error(`Invalid action '${key}'`); return;}
        this.actionMap.get(key)(context, content);
    }

    addClickAction(elementKey, key, content){
        const thisClass = this;
        this.elementMap.get(elementKey).onclick = () => {
            thisClass.playAction(key, content);
        };
    }
}