import { BadRequestException, Injectable } from '@nestjs/common'
import type { DeepPartial } from 'typeorm'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'
import { User } from './models/user.entity'
import type { CreateUserDto, LoginDto } from './dto/user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private UserRepository: Repository<User>,
    private readonly JwtService: JwtService,
  ) {}

  /**
   * 登陆
   * @param loginDto
   * @returns Promise<User>
   */
  async login(loginDto: LoginDto): Promise<string> {
    const findUser = await this.UserRepository.findOne({
      where: { student_number: loginDto.stuNum },
    })
    // 没有找到
    if (!findUser) 
      return '用户不存在'

    // 找到了对比密码
    const compareRes: boolean = bcrypt.compareSync(loginDto.password, findUser.password)
    // 密码不正确
    if (!compareRes) 
      return '密码不正确'
    const payload = { username: findUser.username }

    return this.JwtService.sign(payload)

  }

  /**
   * 创建用户
   * @param createUserDto 
   * @returns Promise<User>
   */
  async createUser(createUserDto: CreateUserDto) {
    const findUser = await this.UserRepository.findOne({
      where: { username: createUserDto.stuName },
    })
    if (findUser && findUser.username === createUserDto.stuName) 
      return '用户已存在'
    if (createUserDto.password !== createUserDto.confirmPassword) 
      return '两次密码不一致'

    // 对密码进行加密处理
    const { stuName, password, email, stuNum, sex, grade } = createUserDto

    const user = new User()
    user.username = stuName
    user.email = email
    user.student_number = stuNum
    user.sex = sex
    user.grade = grade
    user.password = password
    await this.UserRepository.save(user)
    return '注册成功'
  }

  /**
   * 查找所有用户
   * @returns Promise<User>
   */
  async findAll(pageNum: number, pageCount: number): Promise<User[]> {
    const skip = (pageCount - 1) * pageNum
    const take = pageNum
    return this.UserRepository.find({
      take,
      skip,
    })
  }

  /**
   * 根据student_number查找用户
   * @param student_number
   * @returns Promise<User>
   */
  async findByStuNum(student_number: number): Promise<User> {

    const res = await this.UserRepository.findOne({
      where: {
        student_number,
      },
    })
    return res
  }

  /**
   * 根据username查找用户
   * @param username
   * @returns Promise<User>
   */
  async findByName(username: string, pageNum: number, pageCount: number): Promise<User[]> {
    const skip = (pageCount - 1) * pageNum
    const take = pageNum

    const users = await this.UserRepository.find({
      where: {
        username,
      },
      take,
      skip,
    })

    return users
  }

  /**
   * 根据student_number删除用户
   * @param student_number 
   * @returns Promise<User>
   */
  async delUser(student_number: number): Promise<boolean> {
    const res = await this.UserRepository.delete(student_number)
    if (res.affected > 0) 
      return true

    return false
  }
  
  /**
   * 修改用户
   * @param student_number 
   * @returns Promise<User>
   */
  async updateUser(student_number: number, entity: DeepPartial<User>): Promise<boolean> {
    const res = await this.UserRepository.update(student_number, entity)
    if (res.affected > 0) 
      return true
    
    return false
  }
}