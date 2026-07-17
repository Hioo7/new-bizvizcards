import { Controller, Get, Param } from '@nestjs/common';
import { ProductLinkResolverService } from './services/product-link-resolver.service';

@Controller('api/public/product-units')
export class PublicProductLinkController {
  constructor(private readonly resolverService: ProductLinkResolverService) {}

  @Get(':code/resolve')
  resolve(@Param('code') code: string) {
    return this.resolverService.resolve(code);
  }
}
