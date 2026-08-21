SRAM = Static Random Access Memory
即“静态随机存取存储器”。

对于STM32F103C8T6
```
Flash
地址大约从 0x08000000 开始
↓
存放程序代码、常量
掉电后还在

SRAM
地址从 0x20000000 开始
↓
存放运行时变量、栈、临时数据
掉电后丢失
```

