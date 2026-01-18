import { Controller, Get, Patch, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserGoalDto } from './dto/update-user-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('goal')
  async updateGoal(
    @Request() req,
    @Body() updateUserGoalDto: UpdateUserGoalDto,
  ) {
    return this.usersService.updateGoal(req.user.id, updateUserGoalDto);
  }

  @Delete('me')
  async deleteAccount(@Request() req) {
    await this.usersService.deleteAccount(req.user.id);
    return { success: true };
  }
}