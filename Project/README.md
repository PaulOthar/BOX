# BOX file format

Header overhead = 16 + (n * 32); n = number of different file entries.

## Structure
|Name|Bytes|Location|Description|
|-|-|-|-|
|Magic number|4|File header (0x00)|The file format name, used for identifying files of this format. "BOX "|
|File entries size|4|File header (0x04)|How many file entries there is in this package.|
|File entries offset|4|File header (0x08)|The actual location of where the file entries are. Absolute location.|
|Date|4|File header (0x0C)|When was this file was created.|
|Data|?|File (0x10)|The data of every file in this package, in sequence.|
|File name|8|File entry (0x00)|The name of the file. 8 bytes may be used as a long for comparison reasons.|
|File type|8|File entry (0x08)|The type of the file. Bears no meaning for the format, just for the user. 8 bytes may be used as a long for comparison reasons.|
|File metadata|8|File entry (0x10)|File metadata, may be used for specifying image size, and such... up to the user.|
|File size|4|File entry (0x18)|File size in bytes.|
|File offset|4|File entry (0x1C)|File bytes absolute location.|

```
"BOX ", entries, offset, date.
...
data
...
file_name, file_type, file_metadata, file_size, file_offset.
file_name, file_type, file_metadata, file_size, file_offset.
file_name, file_type, file_metadata, file_size, file_offset.
file_name, file_type, file_metadata, file_size, file_offset.
...
```

### Date format
```(0bYYYYYYYYYYYYMMMMDDDDDhhhhhmmmmmm) {Y = Year, M = Month, D = day, h = hour, m = minutes}```