import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UsePipes, ValidationPipe, UploadedFile, UseInterceptors, UseGuards, Request, UploadedFiles, HttpException, HttpStatus, Query, Res, Session, Req, Put } from '@nestjs/common';

import { CreateSellerDto } from './dto/seller/create-seller.dto';
import { UpdateSellerDto } from './dto/seller/update-seller.dto';
import { Seller } from './entities/seller.entity';
////////////////////
import { AnyFilesInterceptor, FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MulterError, diskStorage } from "multer";
import { SellerService } from './seller.service';
import { Product } from './entities/product/product.entity';
import { AvailableQuality } from './entities/product/availableQuality.entity';
import { CreateAvailableQualityOfAProductDto } from './dto/product/create-available-quality.dto';
import { Specification } from './entities/product/specificaiton.entity';
import { Review } from './entities/product/review/review.entity';
import { CreateReviewDto } from './dto/product/review/create-review.dto';
import { CreateReviewReplyDto } from './dto/product/review/create-reviewReply.dto';
import { ReviewReply } from './entities/product/review/reviewReply.entity';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from 'src/seller-auth/local/local-auth.guard';
import { join } from 'path';
import { SessionGuard } from 'src/seller-auth/session/session.guard';
import { JwtAuthGuard } from 'src/seller-auth/jwt/jwt-auth.guard';
import { SellerAuthService } from 'src/seller-auth/seller-auth.service';
import { Category } from './entities/product/category.entity';
import { Brand } from './entities/product/brand.entity';



@Controller('seller')
export class SellerController {
  constructor(
    private readonly sellerService: SellerService ,
    private readonly sellerAuthService : SellerAuthService
    
    ) {}

  /**
   * 1. user jodi emon kono product search kore .. jeta
   *          ->  available na ..
   *          -> available but low quantity ..
   *    -> then seller er kase notification jabe ..
   */
  @UseGuards(SessionGuard)// 🔰
  @Get('sendEmail') 
  sendEmail (){
    const to = "djxyz99@gmail.com";
    const emailSubject = "test1";
    const emailBody = "test 2";
    try{
      this.sellerService.sendEmail(to, emailSubject,emailBody);
    }catch(err){

      // throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      throw new HttpException(
      {
        //1st argument which is response argument -> string / object .. we pass object here
        status : HttpStatus.FORBIDDEN, // statusCode
        error : "Custom Error Message : Email Can Not Send Email format is not correct ", // short description
      },
      HttpStatus.FORBIDDEN // 2nd argument which is status
      ,
      {
        
        cause : err
      }
      );

    }


  }
  @UseGuards(SessionGuard)// 🔰
  @Get('logout')
  async sellerLogOut(/*@Session() session,*/ @Req() req, @Res() res){
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.clearCookie('connect.sid');
      res.status(200).send('Logged out successfully');
      return "logged out !";
    });
  }
  @UseGuards(SessionGuard)// 🔰
  @Get("getShopLogo")
  async getShopLogo(
    @Query('sellerId', ParseIntPipe) sellerId:string,
    @Res() res
  ){
    const shopLogo = await this.sellerService.getShopLogo(sellerId);
    const imagePath = join(__dirname, '..', '..','..', 'uploads', shopLogo); // Adjust the path as needed
    res.sendFile(imagePath);
  }

  // 🏠
  // @UseGuards(JwtAuthGuard)// 🔰
  @Get("getProductImage")
  async getProductImage(
    @Query('imageName') imageName:string,
    @Res() res
  ){
    //const imageName1 = await this.sellerService.getShopLogo(imageName);
    const imagePath = join(__dirname, '..', '..','..', 'uploads', imageName); // Adjust the path as needed
    res.sendFile(imagePath);
  }

  // 🏠
  @Get("getLoggedInUserImage")
  async getLoggedInUserImage(
    @Query('imageName') imageName:string,
    @Res() res
  ){
    //const imageName1 = await this.sellerService.getShopLogo(imageName);
    const imagePath = join(__dirname, '..', '..','..', 'uploads', imageName); // Adjust the path as needed
    res.sendFile(imagePath);
  }

  @UseGuards(SessionGuard)// 🔰
  // 9 🔰 send notification to seller as a products available quality value is same as lowest value to stock
  //🟢🟢
  @Get('checkForLowQuantity') // Almost Stock Out .. 🔰 Low Quantity
  checkForLowQuantity(){
    // joto gula product low quantity .. tar ekta list dibe ..
    //console.log("WE ARE IN CONTROLLER ----------")
    return this.sellerService.checkForLowQuantity();
  }

  @UseGuards(SessionGuard)// 🔰
  // 10 🟢🟢 give product id, who has negetive review .. also, give me those negetive review
  @Get('getAllNegetiveReview')
  getAllNegetiveReview(){
    return this.sellerService.getAllNegetiveReview();
  }

  // 11🔰 give pre order information , if OrderStatus is Pending
  @UseGuards(SessionGuard)// 🔰
  @Get('orderStatusPending') // 10 📃
  getOrderStatusPending(){
    return this.sellerService.getOrderStatusPending();
  }

  // 12🔰 give pre order information , if Payment is complete
  @UseGuards(SessionGuard)// 🔰
  @Get('paymentCompleteOfPreOrder')
  getPaymentCompleteStatusOfPreOrder(){
    return this.sellerService.getPaymentCompleteStatusOfPreOrder();
  }

  //@UseGuards(SessionGuard)// 🔰
  @UseGuards(JwtAuthGuard) 
  //14 🟢🟢🔴 // review add korar pore problem kortese
   @Get('getAllProductsDetails')
   async getAllProductsDetails() : Promise<Product[]>{
    return await this.sellerService.getAllProductsDetails();
   }

   @UseGuards(JwtAuthGuard) 
   //🏠
    @Get('getAProductsDetailsById/:productId')
    async getAProductsDetailsById(@Param('productId', ParseIntPipe) productId: number) : Promise<Product>{
     return await this.sellerService.getAProductsDetailsById(productId);
    }

   
   // 🏠
   @UseGuards(JwtAuthGuard) 
  //🟢 // review add korar pore problem kortese
   @Get('getAllProductsDetailsBySellerId/:sellerId')
   async getAllProductsDetailsBySellerId(@Param('sellerId', ParseIntPipe) sellerId: number) : Promise<Product[]>{
    return await this.sellerService.getAllProductsDetailsBySellerId(sellerId);
   }

   // New 🏠
   @UseGuards(JwtAuthGuard) 
   @Get('getAllCategory')
   async getAllCategory() : Promise<Category[]>{
    return await this.sellerService.getAllCategory();
   }

   // New 🏠
   @UseGuards(JwtAuthGuard) 
   @Get('getAllBrand')
   async getAllBrand() : Promise<Brand[]>{
    return await this.sellerService.getAllBrand();
   }

   // New 🏠
   @UseGuards(JwtAuthGuard) 
   @Post('saveCategory/:id')
   async saveCategory(@Param('id', ParseIntPipe) id: number, @Body() createCategory){
    // createCategory er moddhe array of categoryId ashbe .. 
    console.log("createCategory : ", createCategory,"--",id);
    return await this.sellerService.saveCategory(id,createCategory);
   }

   // New 🏠
   @UseGuards(JwtAuthGuard) 
   @Get('getAllSelectedCategoryForSeller/:id')
   async getSelectedCategoryForSeller(@Param('id', ParseIntPipe) id: number){
    // createCategory er moddhe array of categoryId ashbe .. 
    // console.log("sellerId from getAllSelectedCategoryForSeller controller: ", id);
    return await this.sellerService.getSelectedCategoryForSeller(id);
   }

    // New 🏠
    @UseGuards(JwtAuthGuard) 
    @Get('getProductsBySearch')
    //async getProductsBySearch(@Body() searchValue){
      //async getProductsBySearch(@Query('searchValue') searchValue: string){
    async getProductsBySearch(@Query('searchValue') searchValue:string){
        // @Query('imageName') imageName:string,
     console.log("getProductsBySearch controller: ", searchValue);
     return await this.sellerService.getProductsBySearch(searchValue);
    }

   @UseGuards(SessionGuard)// 🔰
   // 16 🟢🟢
   @UsePipes(new ValidationPipe())// Apply the validation
   @Post('addReview')
   async addReviewToAProduct(@Body() createReviewDto : CreateReviewDto) : Promise<Review>{
    return await this.sellerService.addReviewToAProduct(createReviewDto);
   }

   //@UseGuards(SessionGuard)// 🔰
   @UseGuards(JwtAuthGuard) 
   // 17 🟢🟢
   @Post('addReplyToAReview')
   async addReplyToAReview(@Body() createReviewReplyDto : CreateReviewReplyDto) : Promise<ReviewReply>{
    return await this.sellerService.addReplyToAReview(createReviewReplyDto);
   }

   // 🏠 Add review to seller option rakhte hobe .. 
   // seller id pass korte hobe arki .. 
   // category o pass korte hobe ..  

   // 🏠 show review for specific seller by seller id 
   @UseGuards(JwtAuthGuard)
   @Get('getAllGeneralReview/:id')
   async getAllGeneralReview(@Param('id', ParseIntPipe) sellerId: number): Promise<Review[]>{
    console.log("seller id from front-end from controller: ", sellerId)
    return await this.sellerService.getAllGeneralReview(sellerId);
   }

   //🏠
   @UseGuards(JwtAuthGuard)
   @Delete('deleteReviewByReviewId/:id')
   async deleteReviewByReviewId(@Param('id', ParseIntPipe) reviewId: number){
    console.log("seller id from front-end from controller: ", reviewId)
    return await this.sellerService.deleteReviewByReviewId(reviewId);
   }

   //🏠
   @UseGuards(JwtAuthGuard)
   @Delete('deleteReplyByReplyId/:id')
   async deleteReplyByReplyId(@Param('id', ParseIntPipe) reviewId: number){
    console.log("seller id from front-end from controller: ", reviewId)
    return await this.sellerService.deleteReplyByReplyId(reviewId);
   }

   //🏠
   @UseGuards(JwtAuthGuard)
   @Get('getReviewByReviewId/:id')
   async getReviewByReviewId(@Param('id', ParseIntPipe) reviewId: number){
    console.log("review id from front-end from controller: ", reviewId)
    return await this.sellerService.getReviewByReviewId(reviewId);
   }


   //🏠
   @UseGuards(JwtAuthGuard)
   @Get('getAllAfterSalesReview/:id')
   async getAllAfterSalesReview(@Param('id', ParseIntPipe) sellerId: number){
    console.log("seller id from front-end from controller: ", sellerId)
    return await this.sellerService.getAllAfterSalesReview(sellerId);
   }
   
   //🏠555review
   @UseGuards(JwtAuthGuard)
   @Get('getLikeDislikeStatusForReviewIdAndSellerId')
   async getLikeDislikeStatusForReviewIdAndSellerId(@Query('reviewId', ParseIntPipe) reviewId: number,  @Query('sellerId', ParseIntPipe) sellerId: number){
    //console.log("seller id from front-end from controller: ",reviewId, sellerId)
    return await this.sellerService.getLikeDislikeStatusForReviewIdAndSellerId(reviewId, sellerId);
   }

   //🏠
   //@UseGuards(JwtAuthGuard)
   @Post('doLikeDislikeToAReview')
   async doLikeDislikeToAReview(@Query('reviewId', ParseIntPipe) reviewId: number,  @Query('sellerId', ParseIntPipe) sellerId: number, @Query('likeDislikeStatus') likeDislikeStatus: string){
    //console.log("reviewId id from front-end from controller like dislike: ", reviewId)
    return await this.sellerService.doLikeDislikeToAReview(reviewId, sellerId, likeDislikeStatus);
   }



  //1 🔰create new seller 🟢🔴
  @UseGuards(SessionGuard)// 🔰
  //@UsePipes(new ValidationPipe())// Apply the validation
  @Post()// 📃7
  create(@Body() createSellerDto: CreateSellerDto, ) {
    console.log("WE ARE IN CONTROLLER ----------")
    return this.sellerService.create(createSellerDto);
  }


 ////////////////////////////////////////////////////////////////////////////////////////////



  //2 🔰get all seller 🟢🟢
  @UseGuards(SessionGuard)// 🔰
  @Get()// 📃6
  async findAll() : Promise<Seller[]> {
    return this.sellerService.findAll();
  }


  //3 🔰 get one seller by id 🟢🟢
  //@UseGuards(SessionGuard)// 🔰
  @UseGuards(JwtAuthGuard)
  @Get(':id')// 📃5
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Seller> {
    // console.log("===================================================")
    // console.log("in findOne controller, id : ", id)
    return this.sellerService.findOne(id);
  }

  //@UseGuards(SessionGuard)// 🔰
  @UseGuards(JwtAuthGuard)
  //4 🔰 update a sellers information 🟢🟢🔴 kichu logic add korte hobe
  //@Put(':id')// 📃4
  @Patch('/update/:id')// 📃4

  @UseInterceptors(FileFieldsInterceptor([
    { name: 'sellerImage', maxCount: 1 },
    { name: 'shopLogo', maxCount: 1 },
  ],{ fileFilter: (req, file, cb) => {
    if (file.originalname.match(/^.*\.(jpg)$/))
    cb(null, true);
    else {
    cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
    }
},
limits: { fileSize: 9000000 },
storage:diskStorage({
destination: './uploads',
filename: function (req, file, cb) {
cb(null,Date.now()+file.originalname)
},
})
}))

  update(@Param('id', ParseIntPipe) id: number, @UploadedFiles() files: {
    sellerImage?: Express.Multer.File[],
   // shopLogo?: Express.Multer.File[]
  }, @Body() updateSellerDto) {
    //: UpdateSellerDto
    // console.log("update controller, id : ",id,files.sellerImage, updateSellerDto);
    console.log("======================1🏠")
    console.log("files.sellerImage","🟢", files,"🟢", updateSellerDto,"🟢");
    console.log("======================2🏠")
    console.log("files.sellerImage[0]","🟢", files.sellerImage[0]);
    //console.log("files.sellerImage[0]", files.sellerImage[0]);
 
 
      return this.sellerService.update(id,files.sellerImage[0]
      // ,files.shopLogo
      , updateSellerDto);
  }

  //@UseGuards(SessionGuard)// 🔰
  @UseGuards(JwtAuthGuard)
  //5 delete a seller  🟢🟢 done
  @Delete(':id') // 📃3
  remove(@Param('id', ParseIntPipe) id: number) {
    // 🔰 logged in user tar account delete korte parbe
    return this.sellerService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  // 🏠
  @Delete('product/deleteProduct/:id') // 📃3
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    // 🔰 logged in user tar account delete korte parbe
    console.log("from controller  deleteProduct: ", id)
    return this.sellerService.deleteProduct(id);
  }



  // @UseGuards(AuthGuard('local'))

  // 6 🔰 seller login >> local-strategy 🟢
  //@UseGuards(SessionGuard)
  @UseGuards(LocalAuthGuard)
  @Post('sellerLogin')// 📃2
  sellerLogin(@Request() req, @Session() session) {

    try{
      console.log("========== in sellerLogin controller === req, session, session.email", "==", session, "====", session.email);
      //const user =  this.sellerService.sellerLogin(req);
      if(req.user){
        session.email = req.user.sellerEmailAddress;
      }

      
      return req.user;
    }catch(err){

      throw new HttpException(
      {
        status : HttpStatus.UNAUTHORIZED, // statusCode - 401
        error : "Custom Error Message : Credential is wrong",err, // short description
      },
      HttpStatus.UNAUTHORIZED // 2nd argument which is status
      ,
      {
        //optional //provide an error cause.
        cause : err
      }
      );
    }
  }

  // 7 🔰 seller login >> JWT 🟢
  //@UseGuards(JwtAuthGuard)
  @Post('sellerLoginJWT')// 📃2
  sellerLoginJWT( @Body() loginInfo/*, @Res() res*/ /*@Request() req*/) {
    console.log("dto 🟢🟢", loginInfo);
    
    return this.sellerAuthService.loginWithJWT(loginInfo);
    
  }


  // 8 🔰 Create a new Product 🟢🔴
  //@UseGuards(SessionGuard)// 🔰
  @UseGuards(JwtAuthGuard)
  @Post('createProduct')// 📃1
  async createNewProduct(@Body() createProductDto) : Promise<Product> {
    console.log("------------------- from controller -------------------", createProductDto);
    return await this.sellerService.createNewProduct(createProductDto);
  }

  // 13 🟢🟢
  @Post('addAvailableQualityOfAProduct')
  async addAvailableQualityOfAProduct(@Body() createAvailableQualityOfAProductDto : CreateAvailableQualityOfAProductDto) : Promise<AvailableQuality> {
    return await this.sellerService.addAvailableQualityOfAProduct(createAvailableQualityOfAProductDto);
  }

  // 15 🟢🟢
  @Post('addSpecificationOfAProduct')
  async addSpecificationOfAProduct(@Body() addSpecificationOfAProductDto : CreateAvailableQualityOfAProductDto) : Promise<Specification> {
     // kono ekta category er product er jonno specification er title gula show korbe
  // so, kono ekta category er product er jonno specification title add korte hobe ..

    return await this.sellerService.addSpecificationOfAProduct(addSpecificationOfAProductDto);
  }




   //////////////////////////////  🔰 seller logout
   //////////////////////////////  🔰 seller forgot password

   //////////////////////////////  🔰 send notification to seller as a products stock value is so high that .. it should need some promotion
   //////////////////////////////  🔰 give promotion about a product whose stock value is so low, and there is product shortage of that product

  @Post('uploadAgain')
  // 🟢 for single file upload
  // @UseInterceptors(
  //   FileInterceptor('sellerImage',
  // { fileFilter: (req, file, cb) => {
  //         if (file.originalname.match(/^.*\.(jpg)$/))
  //         cb(null, true);
  //         else {
  //         cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
  //         }
  // },
  // limits: { fileSize: 9000000 },
  // storage:diskStorage({
  // destination: './uploads',
  // filename: function (req, file, cb) {
  // cb(null,Date.now()+file.originalname)
  // },
  // })
  // }),
  // )
  // 🟢 for multiple file upload // maxCount 1
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'sellerImage', maxCount: 1 },
    { name: 'shopLogo', maxCount: 1 },
  ],{ fileFilter: (req, file, cb) => {
    if (file.originalname.match(/^.*\.(jpg)$/))
    cb(null, true);
    else {
    cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
    }
},
limits: { fileSize: 9000000 },
storage:diskStorage({
destination: './uploads',
filename: function (req, file, cb) {
cb(null,Date.now()+file.originalname)
},
})
}))
  //uploadAgain(@UploadedFile() sellerImage: Express.Multer.File, @UploadedFile() shopLogo: Express.Multer.File, @Body() createSellerDto: CreateSellerDto): void
  uploadAgain(
    @UploadedFiles() files: {
      sellerImage?: Express.Multer.File[],
      shopLogo?: Express.Multer.File[]
    }, @Body() createSellerDto: CreateSellerDto): void
  {

    //this.sellerService.uploadAgain(files.sellerImage,files.shopLogo, createSellerDto);
    this.sellerService.uploadAgain(files.sellerImage,files.shopLogo, createSellerDto);

  }




}
