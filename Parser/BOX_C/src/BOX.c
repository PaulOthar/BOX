#include "BOX.h"

#include <stdio.h>

char* box_package_parse_name(uint64_t name, char* buffer){
	for(int i = 0;i < 8 && name;i++){
		buffer[i] = name & 0xff;
		name = name >> 8;
	}
	return buffer;
}

uint64_t box_package_build_name(char* name){
	uint64_t result = 0;
	for(int i = 0; (i < 8) && name[i]; i++){
		result |= (uint64_t) name[i] << (i * 8);
	}
	return result;
}

int box_package_find_resource(box_package* source, uint64_t name){
	for(uint32_t i = 0; i < source->size; i++){
		box_package_entry* entry = &source->entries[i];
		if(entry->name == name){ return i; }
	}
	return -1;
}

#include <stdlib.h>

static uint32_t _box_package_fread_uint32(FILE* file){
	uint8_t buffer[4]; uint32_t result = 0;
	fread(buffer, 4, 1, file);
	for(int i = 0; i < 4; i++){ result |= buffer[3 - i] << (8 * i); }
	return result;
}

static uint64_t _box_package_fread_uint64(FILE* file){
	uint8_t buffer[8]; uint64_t result = 0;
	fread(buffer, 8, 1, file);
	for(int i = 0; i < 8; i++){ result |= buffer[7 - i] << (8 * i); }
	return result;
}

box_package* box_package_read_file(char* path, allocator memory_allocator, box_package* out){
	FILE* file = fopen(path, "rb");
	if(!file){ return 0; }

	uint32_t magic = 0;
	fread(&magic, 4, 1, file);
	if(magic != 0x20584F42){ fclose(file); return 0; }

	out->size = _box_package_fread_uint32(file);

	uint32_t offset = _box_package_fread_uint32(file);

	fread(&out->date, 4, 1, file);

	uint32_t freebyte = sizeof(box_package_entry) * out->size;
	uint8_t* allocated_bytes = (uint8_t*)(memory_allocator(freebyte + (offset - 16)));
	out->entries = (box_package_entry*)allocated_bytes;

	allocated_bytes += freebyte;

	for(uint32_t i = 0; i < out->size; i++){
		box_package_entry* entry = &out->entries[i];
		fseek(file, offset + (i * 32), SEEK_SET);
		fread(&entry->name, 8, 1, file);
		fread(&entry->type, 8, 1, file);
		fread(entry->metadata, 8, 1, file);

		entry->ptr = (void*)allocated_bytes;
		entry->size = _box_package_fread_uint32(file);
		allocated_bytes += entry->size;

		uint32_t entry_offset = _box_package_fread_uint32(file);
		fseek(file, entry_offset, SEEK_SET);
		fread(entry->ptr, entry->size, 1, file);
	}

	fclose(file);
	return out;
}
