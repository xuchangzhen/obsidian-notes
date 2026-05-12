
本次操作接线方式
- **PA9 (USART1_TX)** → USB 转 TTL 的 TX（电脑 RX）
- **PA10 (USART1_RX)** → USB 转 TTL 的 RX（电脑 TX）
- **GND** → USB 转 TTL GND
![[ChatGPT Image 2026年5月12日 11_43_07.png]]
```c
#include "stm32f10x.h"                  // Device header
#include "stm32f10x_rcc.h"
#include "stm32f10x_gpio.h"
#include "stm32f10x_usart.h"

void UART1_Init() {
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);  //开启GPIOA和USART时钟
	
	GPIO_InitTypeDef GPIO_InitStructure;
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	USART_InitTypeDef USART_InitStructure;
	USART_InitStructure.USART_BaudRate = 9600;  //设置发送的波特率
	USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;  //同时设置为接收模式和发送模式
	USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;  //硬件流控制设置为None， 设置为别的会怎么样呢？ 为什么设置为None
	USART_InitStructure.USART_Parity = USART_Parity_No;  //不需要奇偶校验
	USART_InitStructure.USART_StopBits = USART_StopBits_1;  //数据帧的停止位设置为1
	USART_InitStructure.USART_WordLength = USART_WordLength_8b;  //数据帧长度为8bit
	USART_Init(USART1, &USART_InitStructure);
	
	USART_Cmd(USART1, ENABLE);  //使能USART1外设	
}

void SendChar(char c) {
	while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == 0);
	USART_SendData(USART1, c);
}

void SendStr(char *str) {
	while (*str) {  //没有到达字符串的最后一位就继续发送
		SendChar(*str++);
	}
}

int main() {

	UART1_Init();
	
	
	while (1) {
		SendStr("Hello USART\r\n");
		for (uint32_t i = 0; i < 500000; ++i );
	}
	
}


```

现在我们先来解读一下代码
#### 1. 开启RCC时钟
```c
RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);
```
这次代码变成了这样子 其实是一次性开启两个外设时钟 这些外设在stm32内部都有对应的位置 我们把他对应的位置设置为1 就表示开启 然后 | 是有真为真 所以就可以用这种方式开启时钟

#### 2. GPIO口的设置
我们在手册的Memory mapping可以看到 GPIOA9 | 10 都可以在复用模下复用为USART1外设
所以我们就可以将这两个引脚设置为USART的接收和发送引脚
在这里 我们设置的是 GPIOA9为发送引脚 GPIOA10为接收引脚
1. 作为发送端 我们需要将引脚的输出模式设置为复用推挽输出 以为发送数据的时候涉及0/1电平的变化 推挽输出适合
2. 作为接收端 我们需要将引脚设置为浮空输入模式 因为接收的数据也是0/1电平 设置为上拉/下拉输入模式可能会出现冲突 所以将输入引脚配置为浮空输入模式是最好的

#### 3. 配置USART(重点)
```c
	USART_InitTypeDef USART_InitStructure;
	USART_InitStructure.USART_BaudRate = 9600;  //设置发送的波特率
	USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;  //同时设置为接收模式和发送模式
	USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;  //硬件流控制设置为None， 设置为别的会怎么样呢？ 为什么设置为None
	USART_InitStructure.USART_Parity = USART_Parity_No;  //不需要奇偶校验
	USART_InitStructure.USART_StopBits = USART_StopBits_1;  //数据帧的停止位设置为1
	USART_InitStructure.USART_WordLength = USART_WordLength_8b;  //数据帧长度为8bit
	USART_Init(USART1, &USART_InitStructure);
```

配置USART是本篇笔记的重点 配置USART
按照顺序 我们来介绍一下各个参数
1. USART_BaudRate 这个是通信时的波特率 代表1s传输多少bit， 这个波特率需要通信的双方保持一致 不然就会出现接收到的数据乱码的情况
2. USART_Mode 这个就是设置USART的模式 Rx代表接收 Tx代表发送
3. USART_HardwareFlowControl 这个就是USART的硬件流控制方式 空说名字有点抽象 还是得看具体参数
	 - *USART_HardwareFlowControl_None* : 这是本次操作使用的模式 就是关闭硬件流的意思 因为本次操作发送数据的速率不快 并且作为新手 可以减少布线 方便先简单学习一下
	 - *Request To Send(**RST**)*： 请求发送模式 这是接收端向发送端发出信号 代表我准备好了 你可以向我发送数据帧
	 - *Clear To Send(**CTS**)*: 监测模式 由发送端监测接收端状态 避免发送数据过快导致接收端接收不过来 导致缓冲区溢出 当缓冲区可用时把 RTS 拉低（允许发送），缓冲区满时拉高（停止发送）
总结一下

| 信号  | STM32 角色 | 作用                    |
| --- | -------- | --------------------- |
| RTS | 通知对方     | “我准备好接收了”，对方才可以发送数据给我 |
| CTS | 接收对方     | “对方允许我发送”，我才能发送数据给对方  |
![[ChatGPT Image 2026年5月12日 15_41_46.png]]
根据这个图片一看 其实CTS监测的就是接收端RTS的请求发送信号

4. USART_Parity这个就是奇偶校验 在数据帧添加一个奇偶校验 我们以~~USART_WordLength_8b~~为例
	奇偶校验就是检验数据位中1的个数是奇数还是偶数 校验位为0表示1的个数为奇数 校验位为1表示1的个数为偶数

既然这里说到了USART_WordLength 那么就先说一下吧 这个就是数据位的长度 这里是设置为了8bit

==这是没有奇偶校验时数据帧==
![[ChatGPT Image 2026年5月12日 23_47_29.png]]

==这是有奇偶校验时数据帧==
![[ChatGPT Image 2026年5月13日 00_05_43.png]]


5. 还有一个设置停止位 我们默认就是设置为1 重新拉高电平 为下一次发送数据做准备

#### 4. SendChar函数
这个函数没啥特别 但是涉及了新的参数
USART_GetFlagStatus 这个是获取标志位状态的 等待USART缓冲区空闲
**TXE 标志**（Transmit Data Register Empty) 有两个状态 1代表数据寄存器为空 可以写入数据
											0则表示还在发送之前的数据 需要进行等待
通过 USART_FLAG_TXE 可以获取数据寄存器的状态

#### 5. 同步和异步的区别

同步相较于异步 多接了一根时钟线 可以提高发送数据的速率和稳定性 但是对硬件有了更高的要求且布线更加复杂

|特性|异步通信（UART 异步）|同步通信（UART 同步/I²C/SPI）|
|---|---|---|
|时钟|没有外部时钟线|由时钟线提供同步信号|
|波特率|必须双方约定|不需要约定，采样由时钟沿控制|
|布线|TX/RX + GND|TX/RX + CLK + GND（可能还有片选）|
|数据采样|按约定波特率计时采样|按时钟沿采样，完全同步|
