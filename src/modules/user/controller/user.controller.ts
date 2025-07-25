import {
  Controller,
  Body,
  Req,
  Res,
  Patch,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserService } from '../service/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import sendResponse from 'src/common/utils/sendResponse';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }




@Get('providers')
async getProviders(@Query() query: any) {
  const {
    status,
    specialist,
    country,
    latitude,
    longitude,
    rangeInKm,
    page = 1,
    limit = 10,
  } = query;
  
  const result = await this.userService.getFilteredProviders({
    status,
    specialist,
    country,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    rangeInKm: rangeInKm ? parseFloat(rangeInKm) : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  return {
    success: true,
    ...result,
  };
}


@Get('/allProviders')
async getAllProviders(@Req() req, @Res() res) {
  const specialist = req.query.specialist as string | undefined;

  const result = await this.userService.getAllProviders(specialist);

  return sendResponse(res, {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'All providers fetched successfully!',
    data: result,
  });
}




  @Patch()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'certificate', maxCount: 1 },
    ])
  )
  async updateUser(
    @Req() req,
    @Body() payload: UpdateUserDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
    @Res() res,
  ) {
    const image = files.image?.[0];
    const certificate = files.certificate?.[0];

    console.log('Image:', image);
    console.log('Certificate:', certificate);
    console.log('Payload:', payload);
    console.log('User:', req.user);
    const result = await this.userService.updateUser(req.user, payload, image, certificate);
    sendResponse(res, {
      success: true,
      statusCode: HttpStatus.OK,
      message: "User updated successfully!",
      data: result
    })
  }

  @Get('/provider/locations')
  async getProviderLocations() {
    const data = await this.userService.getProviderLocations();
    return {
      message: 'Provider locations fetched successfully',
      data,
    };
  }


  @Get('singleProvider/:id')
async getProviderById(@Param('id') id: string, @Res() res) {
  const result = await this.userService.getProviderById(id);

  return sendResponse(res, {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'Provider fetched successfully!',
    data: result,
  });
}


  @Get('/:id')
  async getUserById(@Req() req, @Res() res, @Param('id') id) {
    const result = await this.userService.getUserById(req.user, id);

    return sendResponse(res, {
      success: true,
      statusCode: HttpStatus.OK,
      message: "User fetched successfully!",
      data: result
    })
  }






}
