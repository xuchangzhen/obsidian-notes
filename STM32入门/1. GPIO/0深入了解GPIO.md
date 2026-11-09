关于GPIO的七个寄存器

| 寄存器  | 英文全称                        | 中文名称      | 主要功能                 |
| ---- | --------------------------- | --------- | -------------------- |
| CRL  | Configuration Register Low  | 低位配置寄存器   | 配置 GPIO 0～7 引脚的工作模式  |
| CRH  | Configuration Register High | 高位配置寄存器   | 配置 GPIO 8～15 引脚的工作模式 |
| IDR  | Input Data Register         | 输入数据寄存器   | 读取引脚当前输入电平           |
| ODR  | Output Data Register        | 输出数据寄存器   | 存储 GPIO 输出数据，控制输出电平  |
| BRR  | Bit Reset Register          | 位复位寄存器    | 将 ODR 对应位置 0         |
| BSRR | Bit Set/Reset Register      | 位设置/复位寄存器 | 将 ODR 对应位置 1 或清 0    |
| LCKR | Configuration Lock Register | 配置锁定寄存器   | 锁定 GPIO 引脚配置，防止意外修改  |

STM32，那么寄存器应该差不多都是32位，现在来解释一下这些寄存器

CRL和CRH都是用于配置GPIO寄存器的，但是由于32位控制的引脚数量有限，STM32一组一共有16个引脚，所以CR被分成了两个，CRL控制\[7:0]号引脚，CRH控制\[8:15]号引脚

[来开始看手册](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101-103-105-107-stm32f100-series-armbased-32bit-mcus-stmicroelectronics.pdf)
![[Pasted image 20261109201017.png|670]]

可以看到每个引脚由四位配置寄存器来配置
CNF\[1:0]负责配置引脚的模式，例如模拟，浮空输入，开漏输出，推完输出
MODE\[1"0]负责配置引脚为输入还是输出，以及输出的速度

再往下看到输入寄存器IDR
![[Pasted image 20261109201347.png]]

Bits 31:16 Reserved, must be kept at reset value.  表示这里是保留位，没有使用，需要保存默认值
看到这是一个只读寄存器，保存着IO口的外部电平状态，有需要外部输入的东西就是看这个寄存器


下面是输出寄存器ODR
![[Pasted image 20261109202100.png]]

看到描述这个寄存器可读可写，并且通过软件控制，也就是代码控制，
can be accessed in Word mode only. 代表访问的最小单位是word

### Word、Half-word、Byte 的区别

| 访问模式      | 中文  | 位数     | 字节数     |
| --------- | --- | ------ | ------- |
| Byte      | 字节  | 8 bit  | 1 Byte  |
| Half-word | 半字  | 16 bit | 2 Bytes |
| Word      | 字   | 32 bit | 4 Bytes |
下面还有一句NOTE，对于原子操作atomic operation，这些引脚可以被单独的设置为SET/RESET通过BSRR，我们刚刚也知道通过ODR来改变引脚状态访问的最小单位是word，也就是32位，通过BSRR就可以单独按位操作

下面就来看位设置/复位寄存器BSRR
![[Pasted image 20261109204524.png]]

这个寄存器是只写寄存器，不允许读取，实在是硬读的话得到的数据都是0
我们看到这个寄存器也是通过32字节访问，但是可以只控制一个位
然后低16位是将引脚设置为高电平，高16位是复位引脚，也就是清零

下面是复位寄存器BRR
![[Pasted image 20261109205036.png]]

这个东西和BSRR的高16位是一样的功能，所以这个寄存器可以说是冗余的，


