import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './User.entity.js';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string) {
  return this.repo
    .createQueryBuilder('u')
    .addSelect('u.password')
    .where('u.email = :email', { email })
    .getOne();
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }
}