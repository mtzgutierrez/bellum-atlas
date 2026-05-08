import { Test, TestingModule } from '@nestjs/testing';
import { CommanderController } from './commander.controller';
import { CommanderService } from './commander.service';

describe('CommanderController', () => {
  let controller: CommanderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommanderController],
      providers: [CommanderService],
    }).compile();

    controller = module.get<CommanderController>(CommanderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
