
第一个版本：**按住亮，松开灭**。

```c
#include "stm32f10x.h"                  // Device header

int main(void) {

	GPIO_InitTypeDef GPIO_InitStructure;
	
	//开启时钟
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
	
	//配置LED引脚 PA1 为推挽输出
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitStructure);
	
	//配置按键引脚
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_12;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
	//为什么不需要设置频率了?
	// 输入模式不需要设置输出速度，GPIO_Speed 只对输出口有效
	GPIO_Init(GPIOB, &GPIO_InitStructure);  //同时使用两个一样的GPIO_InitStructure地址 不会相撞吗
	//不会 已经在GPIO_Init时运行过了
	//GPIO_Init 读取配置结构体内容配置对应 GPIO 寄存器，不保留结构体自身数据
	
	GPIO_ResetBits(GPIOA, GPIO_Pin_1);  //初始化为低电平
	
	while (1) {
		
		if (GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_12) == 0 ) {
			GPIO_SetBits(GPIOA, GPIO_Pin_1);
		}else {
			GPIO_ResetBits(GPIOA, GPIO_Pin_1);
		}
	}

}	

```

在当前模式下 我试着用万用表测了一下电压 
1. 按键未按下时 小灯有微弱电压 按键两侧电压为3.26V
2. 按键按下时 小灯两侧电压为2.86V， 按键两侧无电压
可以解释一下这个电压的现象吗

解释
按键未按下时 我的PB12引脚 也就是接上按键的引脚 此时未有回路 所以不产生电流 所以电阻两端并没有产生压降 弱拉到 VDD 电势 所以这个引脚上电势为VDD的 然后我的万用表测的是两端电势 所以我万用表另一个表笔随便乱接一个0V电势的地方 测出来的都是vdd的电压 然后当按键按下 电路导通 但是内接了一个超级大电阻 此时电路导通 电流通过上拉电阻 导致按键这边的电压只有接近0V了 所以按键这边的电势能来到一个很低的值 相当于接地 这样也可以说明了我为什么小灯接在PB12为什么不能点亮的原因了



第二个版本：**按一下，灯亮/灭切换一次**。
```c
#include "stm32f10x.h"                  // Device header

void Delay(volatile uint32_t count)
{
    while (count--);
}

int main() {

	GPIO_InitTypeDef GPIO_InitSteucture;
	uint8_t LedStatus = 0;
	
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
	RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
	
	//初始化小灯引脚为推挽输出
	GPIO_InitSteucture.GPIO_Pin = GPIO_Pin_1;
	GPIO_InitSteucture.GPIO_Mode = GPIO_Mode_Out_PP;
	GPIO_InitSteucture.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_Init(GPIOA, &GPIO_InitSteucture);
	
	//初始化按键引脚为上拉输入
	GPIO_InitSteucture.GPIO_Pin = GPIO_Pin_12;
	GPIO_InitSteucture.GPIO_Mode = GPIO_Mode_IPU;
	GPIO_Init(GPIOB, &GPIO_InitSteucture);
	
	GPIO_ResetBits(GPIOA, GPIO_Pin_1);
	
	while(1) {
		//检测按键是否按下
		if (GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_12) == 0) {
			Delay(20000);
			if (GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_12) == 0) {
				LedStatus = !LedStatus;
				
				if (LedStatus == 1) {
					GPIO_SetBits(GPIOA, GPIO_Pin_1);
				}else {
					GPIO_ResetBits(GPIOA, GPIO_Pin_1);
				}
			}
			while (GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_12) == 0);  //等待按键松手 防止状态一直变化
		}
	}


}

```

解释一下 Delay函数并没有内置的 都是自己写的
- 为什么在这里需要deday延时？
因为按键按下时会有抖动 如果不做防抖的话就会被识别为按下多次 导致电平乱跳
- while (GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_12) == 0)
这一段是为了防止按键被持续按下 导致电平一直翻转
软件延时（循环延时）是一种最简单的防抖方法，但它**时间不精确**；更稳定的防抖通常结合时间计数或定时器实现。

