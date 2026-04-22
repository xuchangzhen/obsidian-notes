```c
#include "stm32f10x.h"                  // Device header

int main(void) {

	RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	GPIO_InitTypeDef GPIO_InitStructure;
	
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	TIM_TimeBaseInitTypeDef TimeBaseStructure;
	
	TimeBaseStructure.TIM_Period = 7200 - 1;
	TimeBaseStructure.TIM_Prescaler = 10000 - 1;
	TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV4;
	TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
	
	TIM_TimeBaseInit(TIM2, &TimeBaseStructure);
	TIM_Cmd(TIM2, ENABLE);
	while(1){
		if (TIM_GetFlagStatus(TIM2, TIM_FLAG_Update) != RESET) {
			TIM_ClearFlag(TIM2, TIM_FLAG_Update);
			GPIO_WriteBit(GPIOA, GPIO_Pin_1, 
				(BitAction)(1-GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_1))
			);
		}
	}

}	

```


#### 1. 开启外设时钟
```c
	RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
```
在每次启用一个外设之前 我们都需要开启外设时钟并使能
这里我们可以看到定时器外设在APB1总线上 那么我们就会有疑问了 为什么他在APB1总线上？
此时我们可以翻开手册 看目录页里面找
- **Memory map**
- **Register boundary addresses**
现在我们找到的是==Memory map==
![[Pasted image 20260422154526.png]]

看图 哎呀 乱七八糟的到底是什么东西 别急 
STM32F103 的外设地址是这样分的：
- **`0x4000 0000 ~ 0x4000 7FFF`**：**APB1 总线**（低速外设）
- **`0x4001 0000 ~ 0x4001 FFFF`**：**APB2 总线**（高速外设）
这样子我们就很好知道我们需要的外设是在哪个总线了

#### 2. 初始化小灯所在引脚
```c
	GPIO_InitTypeDef GPIO_InitStructure;
	
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
```
这里已经轻车熟路 没什么好说的了

#### 3. 初始化TIM2外设
```c
	TimeBaseStructure.TIM_Period = 7200 - 1;
	TimeBaseStructure.TIM_Prescaler = 10000 - 1;
	TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
	TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
	
	TIM_TimeBaseInit(TIM2, &TimeBaseStructure);
	TIM_Cmd(TIM2, ENABLE);
```
这里是新知识 很有说法了
首先我们得知道定时时间是怎么设置的 
![[Pasted image 20260422154949.png]]
**1. Interrupt Time** 就是指的是定时时间 
**2. Clock Frequency** 指的是系统外设时钟频率 APB1 默认频率是 36 MHz，但定时器时钟倍频成 72 MHz
**3. PSC是预分频值** 预分频器决定了每隔多少个内部脉冲 定时器才动一下 举个例子 某个人一秒可以走100步 当我们设置预分频值为10时 这个人每走10步记1次 也就是当走完1秒100步时 实际上是记
了10次
**4. ARR自动重装载值** 这个相当于计数器的终点 当计数器的值计数到ARR时 就会清零

好的 了解了那么多了 现在我们应该来了解一下这个PSC和ARR我们应该怎么设置了
我们可以推导一下 就可以根据想要定时的时间来合理设置PSC和ARR了

![[IMG_20260422_204058.jpg]]

所以我们可以得到
- **freq = Fsys / (PSC + 1)**
- **ARR = freq * 定时时间 - 1**
但是freq和ARR的值不是无限的

为什么这个公式有+1？![[Pasted image 20260422154949.png]]

PSC = 10 → **分频系数 = PSC + 1 = 11**
CNT 从 0 开始计数 → 到 ARR 时触发溢出
他的计数是从0开始的 如果不 +1 就会少计一次 计时时间变长

| 参数           | 类型     | 可取范围    | 注意事项                 |     |
| ------------ | ------ | ------- | -------------------- | --- |
| Prescaler    | 16-bit | 0~65535 | 实际分频 = Prescaler + 1 |     |
| ARR (Period) | 16-bit | 0~65535 | 超过需要调大 Prescaler     |     |
|              |        |         |                      |     |
16bit 就是 2^16 


**5. TIM_ClockDivision**
这个就是时钟分频 一共有四个参数

![[Pasted image 20260422110819.png|587]]

DIV1， 2， 4代表的是分频系数 但是2， 4只有高级定时器能用

那这个有什么用呢？ 1， 2， 4代表了几次外部时钟周期才算一次计数
也就是当DIV2时 我们需要计数完两次才执行中断 也就是可以延长计时时间
然后还有一个IS_TIM_CLD_DIV是判断参数是否合法的

assert_param(IS_TIM_CKD_DIV(TIM_CKD_DIV1));  // 检查参数是否合法
`IS_TIM_CKD_DIV(x)` 会返回 **TRUE / FALSE**：

**6. TIM_GetFlagStatus**
这个是获取TIM时钟状态的方法 当时钟定时到时间时 标志位就会置1 也即是高电平 此时就代表了完成了一次计数

TIM_ClearFlag(TIM2, TIM_FLAG_Update);是清除标志位 也就是会把标志位拉低到0
其实我们也可以这样子写 TIM_ClearFlag(TIM2, 0); 也是没有错的

```c
GPIO_WriteBit(GPIOA, GPIO_Pin_1, 
	(BitAction)(1-GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_1))
);
```
这个其实就是翻转电平 当电平为1时 1 - 1 = 0  当电平为0时 1 - 0 = 1
BitAction是类型转换 转换为SetBIts， ResetBit这种格式

**7. TIM_CounterMode**
这个是计数模式 现在TIM_CounterMode_Up就是向上计数

#### 7. TIM初始化结构体最后一个参数

![[Pasted image 20260422110425.png|357]]!

RepetitionCounter 这个也是高级定时器才有的东西
这个就是设置需要重复计数多少次才触发中断 也就是说它可以实现更长时间的计时

#### 8. 为什么本次操作选用TIM2而不是别的(AI)
|定时器类型|适合场景|本次实验选择原因|
|---|---|---|
|TIM1/TIM8 高级|高级 PWM、电机控制|功能过剩，复杂|
|TIM2~TIM5 通用|定时、PWM、输入捕获|简单、资源足够、库函数支持好 ✅|
|TIM6/TIM7 基本|仅产生更新事件|也可用，但无输出功能，不方便 LED|

