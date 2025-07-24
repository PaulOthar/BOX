#ifndef BOX_PACKAGE
#define BOX_PACKAGE

#include <stdint.h>
#include <stddef.h>

typedef struct{
	uint64_t name;
	uint64_t type;
	uint8_t metadata[8];
	uint32_t size;
	void* ptr;
}box_package_entry;

typedef struct{
	box_package_entry* entries;
	uint32_t size;
	uint32_t date;
}box_package;

typedef void* (*allocator)(size_t size);

char* box_package_parse_name(uint64_t name, char* buffer);

uint64_t box_package_build_name(char* name);

int box_package_find_resource(box_package* source, uint64_t name);

box_package* box_package_read_file(char* path, allocator memory_allocator, box_package* out);

#endif
