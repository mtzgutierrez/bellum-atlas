import { Controller } from '@nestjs/common';
import { CommanderService } from './commander.service';

@Controller('commander')
export class CommanderController {
  constructor(private readonly commanderService: CommanderService) {}
}
