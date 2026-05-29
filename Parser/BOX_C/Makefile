CC = gcc
CFLAGS = -Wall -Wextra -O0 -g3 -std=c99

SRC_DIR = src
INC_DIR = include
BIN_DIR = bin

#-------------------------------------------------
	
SRC = $(wildcard ./$(SRC_DIR)/*.c) $(wildcard ./$(SRC_DIR)/*/*.c)
OUTPUT = ./$(BIN_DIR)/bin.exe

all:
	$(CC) $(SRC) -o $(OUTPUT) -I./$(INC_DIR) $(CFLAGS)
	
#-------------------------------------------------

VAL_DIR = valgrind
VALGRIND_OUT = ./$(VAL_DIR)/analysis.out
CALLGRIND_FLAGS = --tool=callgrind --dump-line=yes --dump-instr=yes --collect-jumps=yes --collect-systime=yes --collect-bus=yes --cache-sim=yes --branch-sim=yes --simulate-wb=yes --simulate-hwpref=yes --cacheuse=yes --time-stamp=yes

mcall:
	make all
	mkdir -p $(VAL_DIR)
	rm -f $(VALGRIND_OUT)
	valgrind $(CALLGRIND_FLAGS) --callgrind-out-file=$(VALGRIND_OUT) $(OUTPUT)
	sudo kcachegrind $(VALGRIND_OUT)