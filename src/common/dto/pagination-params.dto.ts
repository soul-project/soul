import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { DEFAULT_NUM_ITEMS_PER_PAGE } from '../constants';

export class PaginationParamsDto {
  @ApiProperty({ name: 'page', example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({
    name: 'num_items_per_page',
    example: 10,
    type: Number,
    required: false,
  })
  @Expose({ name: 'num_items_per_page' })
  @IsOptional()
  @Transform((value) =>
    value.value ? Number(value.value) : DEFAULT_NUM_ITEMS_PER_PAGE,
  )
  @IsInt({ message: 'num_items_per_page must be an integer' })
  @Max(100, { message: 'num_items_per_page must be less than 100' })
  @Min(1, { message: 'num_items_per_page must be greater than 0' })
  numItemsPerPage = DEFAULT_NUM_ITEMS_PER_PAGE;
}
