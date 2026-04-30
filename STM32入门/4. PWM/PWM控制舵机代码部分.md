
这是PWM控制舵机的代码
```c
#include "stm32f10x.h"                  // Device header

void Delay(uint32_t count) {
	for (; count != 0; --count);
}

void Servo_PWM_Init() {
	//定义初始化结构体
	GPIO_InitTypeDef GPIO_InitStructure;
	TIM_TimeBaseInitTypeDef TimeBaseInitStructure;
	TIM_OCInitTypeDef OCInitStructure;
	
	//开启RCC外设时钟
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
	
	//初始化PA0
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	//初始化TIM2时钟
	TimeBaseInitStructure.TIM_Prescaler = 72 - 1;  //规定舵机运转分频
	TimeBaseInitStructure.TIM_Period = 20000 - 1;  //规定舵机运转周期
	TimeBaseInitStructure.TIM_CounterMode = TIM_CounterMode_Up;
	TimeBaseInitStructure.TIM_ClockDivision = 0;
	TimeBaseInitStructure.TIM_RepetitionCounter =0;
	TIM_TimeBaseInit(TIM2, &TimeBaseInitStructure);
	
	//初始化输出比较器
	OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
	OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
	OCInitStructure.TIM_Pulse = 1500;
	OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
	TIM_OC1Init(TIM2, &OCInitStructure);  //将OC结构体写入TIM2定时器的通道1
	TIM_OC1PreloadConfig(TIM2, TIM_OCPreload_Enable);  //开启预装载寄存器
	
	TIM_Cmd(TIM2, ENABLE); 
}


int main() {
	
	Servo_PWM_Init();
	
	while(1) {
		TIM_SetCompare1(TIM2, 500);
		Delay(7200000);
		TIM_SetCompare1(TIM2, 1000);
		Delay(7200000);
		TIM_SetCompare1(TIM2, 1500);
		Delay(7200000);
		TIM_SetCompare1(TIM2, 2000);
		Delay(7200000);
		TIM_SetCompare1(TIM2, 2500);
		Delay(7200000);

	}
}


```

这是舵机的接线图
![[Pasted image 20260428151651.png]]

舵机角度对应脉冲时间
![[Pasted image 20260428153216.png]]

#### 1. OCInitStructure
这是输出比较结构体 用来初始化TIM输出PWM波的
[详细参数介绍](OCInitStructure参数.md)

#### 2. TIM_SetCompare1;
这个就是在改变Pulse的值 在改变脉宽
![[PWM1ms.png]]
这个图可以很形象的表示PWM控制舵机时脉宽的周期的关系

#### 3. GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
这次居然不是Out_PP
是应该这次我们需要在GPIO口输出PWM波信号 而不是普通的高低电平了 所以我们得用复用推挽输出
但是我们看代码 发现TIM2什么时候就和GPIOA0口写在一起了？好像没有
其实这个已经在手册里面写好了复用关系
之前我们在[[如何判断使用哪个引脚]]笔记中已经有了 就是看手册中的Default位置 代表默认复用的功能
![[Pasted image 20260430092605.png]]
这里我们就可以看到PA0默认复用了TIM2的通道1




