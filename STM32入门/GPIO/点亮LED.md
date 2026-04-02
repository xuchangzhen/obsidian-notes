  作为第一个项目 有很多东西都不知道 所以该笔记会涉及很多解释

## 1. 点灯第一步-先找到一个合适的引脚给他插上去

  1. 那么多的引脚 其实并不是所有引脚都可以用 详细使用看[[如何判断使用哪个引脚]]
  2. 选择好引脚之后就开始[[配置引脚]]
  3. 插上对应的引脚 
  4. 烧录点灯


**注意 我们点灯的时候通常是使用推挽输出 push-pull， 但是代码里面我还写了开漏输出的 以用于理解相关知识**


示例代码
```c
#include "stm32f10x.h"                  // Device header

int main(void) {

	GPIO_InitTypeDef GPIO_InitStructure;
	
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_OD;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	GPIO_ResetBits(GPIOA, GPIO_Pin_1);	
	
	while (1) {
		
	}
}	
```

下面我们来解释一下这个代码 

#include "stm32f10x.h"      //就是导入当前设备

GPIO_InitTypeDef GPIO_InitStructure;  //定义一个引脚初始化的结构体 每个引脚在使用前都要进行这个操作

**引脚初始化结构体的三个参数**

GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;   //初始化的引脚为1号引脚
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_OD;  //设置引脚模式为开漏输出 open-drain
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;  //设置[引脚频率](引脚频率如何设定.md)为50Mhz

GPIO_Init(GPIOA, &GPIO_InitStructure);  //初始化引脚 引脚组号为A

GPIO_ResetBits(GPIOA, GPIO_Pin_1);	 //表示GPIOA1引脚被设置为了低电平


**通过之前的学习我们知道开漏输出不能主动输出高电平 所以当我们的代码是下面的样子的时候 是无法将小灯点亮的**

```c
#include "stm32f10x.h"                  // Device header

int main(void) {

	GPIO_InitTypeDef GPIO_InitStructure;
	
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_OD;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	GPIO_SetBits(GPIOA, GPIO_Pin_1);	
	
	while (1) {
		
	}

}	

```


**但是呢 其实开漏输出也可以电灯的 我们只需要设置引脚为开漏输出并且设置为低电平 将小灯阳极接在3.3V接口即可**

```c
#include "stm32f10x.h"                  // Device header

int main(void) {

	GPIO_InitTypeDef GPIO_InitStructure;
	
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_OD;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	GPIO_ResetBits(GPIOA, GPIO_Pin_1);	
	
	while (1) {
		
	}

}	

```


  