#include <stdio.h>

#include "BOX.h"
#include <stdlib.h>

int main(){
	box_package package;
	box_package_read_file("demo.box", malloc, &package);

	for(int i = 0; i < package.size; i++){
		box_package_entry* entry = &package.entries[i];
		char name[9] = {0};
		char type[9] = {0};
		box_package_parse_name(entry->name, name);
		box_package_parse_name(entry->type, type);
		printf("%s\t-\t%s\t>\t%d\n",name, type, entry->size);
	}

	int index = box_package_find_resource(&package, box_package_build_name("MYFONT"));
	printf("%d %d -> ", index, package.entries[index].size);

	for(int i = 0; i < package.entries[index].size; i++){
		printf("%02X ",((uint8_t*)package.entries[index].ptr)[i]);
	}
	return 0;
}
