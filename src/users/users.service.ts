import { UserSignInDto } from './dto/user-signin.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSignupDto } from './dto/user-signup.dto';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { FindOneOptions } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async signup(userSignupDto: UserSignupDto): Promise<UserEntity> {
    const userExist = await this.findUserByUsername(userSignupDto.username);
    if (userExist) throw new BadRequestException('Username is not available');
    userSignupDto.password = await hash(userSignupDto.password, 10);
    let user = this.usersRepository.create(userSignupDto);
    user.role = user.determineUserRole();
    user = await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  async signin(userSignInDto: UserSignInDto) {
    const userExist = await this.usersRepository
      .createQueryBuilder('users')
      .addSelect('users.password')
      .where('users.username=:username', { username: userSignInDto.username })
      .getOne();

    if (!userExist) throw new BadRequestException('Username is not available');
    const matchPassword = await compare(userSignInDto.password, userExist.password);
    if (!matchPassword) throw new BadRequestException('Password is not available');
    delete userExist.password;
    return userExist;
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number) {
    const options: FindOneOptions<UserEntity> = { where: { id } };
    const user = await this.usersRepository.findOne(options);
    if (!user) throw new NotFoundException('User not found');
    return user;
}

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findUserByUsername(username: string) {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async accessToken(user: UserEntity) {
    return sign({ username: user.username, role: user.role }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn:3000 });
  }
  
  async refreshToken(user: UserEntity) {
    if (!process.env.REFRECH_TOKEN_SECRET_KEY) {
      throw new Error('REFRECH_TOKEN_SECRET_KEY is missing in .env file');
    }
    
    return sign(
      { username: user.username , role: user.role }, 
      process.env.REFRECH_TOKEN_SECRET_KEY, // Assurez-vous que la clé secrète est correctement définie dans .env
      { expiresIn:3000 }
    );
  }

}
