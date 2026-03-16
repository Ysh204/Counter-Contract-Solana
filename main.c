// main.c
#include <stdio.h>
#include "mylib.h"  // Include the Rust header file

int main() {
    int input = 5;
    int result = double_value(input);  // Call the Rust function
    printf("The result is: %d\n", result);
    return 0;
}
