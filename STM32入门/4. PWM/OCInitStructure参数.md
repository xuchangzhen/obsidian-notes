OCInitStructure里面有这么几个参数
![[Pasted image 20260428155500.png]]
![[Pasted image 20260428155524.png]]

===可以看到很多参数其实长得差不多 就多了个N 就比如TIM_OCIdleState和TIM_OCNIdleState 这个N代表互补的意思 Complementary===

#### 1. TIM_OCIdleState
这个参数只有在高级定时器里才有 代表定时器停止时 OC输出的状态
里面又有那么几个参数
![[Pasted image 20260428155847.png]]
其中 IS_TIM_OCIDLE_STATE就是判断参数是否正确的
下面两个就是设置为高电平和低电平

TIM_OCNIdleState就代表互补输出状态

#### 2. OCMode
这是控制输出比较通道的模式的
下面又有那么多参数
![[Pasted image 20260429201919.png]]
1. TIM_OCMode_Active: CNT == CCR  时输出高电平 CNT < CCR时 保持原状态 CNT > CCR时 保持高电平(CNT == CCR 时拉高的)
2. TIM_OCMode_Inactive: CNT == CCR 时输出低电平 CNT < CCR时 保持原状态 CNT > CCR时 保持低电平(CNT == CCR 时拉低的)
3. TIM_OCMode_PWM1: CNT < CCR( Pulse ) 输出高电平, CNT >= CCR 输出低电平
4. TIM_OCMode_PWM2: CNT < CCR(Pulse) 输出低电平, CNT >= CCR 输出高电平
5. TIM_OCMode_ForcedActice: 强制输出高电平 高级定时器特有 还有另一个是输出低电平的
6. TIM_OCMode_Timing: 定时器计数到CCR时 只产生事件或中断 不会改变引脚状态
7. TIM_OCMode_Toggle:  每次计数到CCR时 改变引脚状态 主要用于输出方波信号

#### 3. TIM_OCPolarity
设置高低电平极性(哪个电平代表有效脉冲)
有两个参数
1. TIM_OCPolarity_High 代表高电平有效
2. TIM_OCPolarity_Low 代表低电平有效

#### 4. TIM_OutputState
代表 使能/禁止 输出到GPIO引脚
有两个参数
1. TIM_OutputState_Enable 使能 开启输出
2. TIM_OutputState_Enable 禁止输出

#### 5. Pulse
代表输出脉宽 初始化的就是CCR的值
这个脉宽具体是高电平还是低电平看OCMode
然后这个主要是一个周期里面设置电平所占用的时间
这个周期就是我们之前设置的Period 在本次舵机时钟的实验中 设置的是20000 也就是需要CNT计数到20000 那这个具体是多少时间呢？就要看Prescaler了 我们本次实验系统内部时钟是72MHz， Prescaler设置为72， 那么 Freq = 72MHz / 72， 那么
Freq = 1Mhz， t = 1 / 1MHz,
t = 1 * 10 ^ -6 (s)
也就是1μs 然后要经过2 * 10 ^ 4 个 1μs, 那么整个周期就是20ms


