import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SellerService } from 'src/seller/seller.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Seller } from 'src/seller/entities/seller.entity';
import { In, Repository } from 'typeorm';
import { Buyer } from 'src/seller/entities/buyer.entity';

@Injectable()
export class MessageService {
  /**
   * 🤔🙋‍♂️❓seller and buyer ki duita alada table e store korbo ? 
   * naki same table e store korbo .. 
   * 
   * ❓seller service e ekta variable declare kora ase ... sheta amar message service e access 
   * kora lagbe .. ekhon ami ki korbo .. 
   */
  constructor(
    private sellerService : SellerService, 
    @InjectRepository(Message) private messagesRepository: Repository<Message>,
    @InjectRepository(Conversation) private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Seller) private sellersRepository: Repository<Seller>,
    @InjectRepository(Buyer) private buyersRepository: Repository<Buyer>,
    ){}

   

  // I think done 🟢
  async createNewMessage(createMessageDto /*: CreateMessageDto*//*, senderEmail:string*/) : (Promise<Message>) {
    let existFlag : boolean = false;  
    let againExistFlag : boolean = false;  
    let participantsAreInDBBBB ; 
  const {receiverEmail, message, senderEmail} = createMessageDto;
    const newMessage = {
      messageId : Date.now(),
      senderEmail : senderEmail, // html input type hidden 
      receiverEmail : receiverEmail,
      message : message,
      
    }
    // console.log("new Message Created 1. ",newMessage);
    // check conversation already exist or not 
    

    const participant_email1 =  senderEmail+'-'+receiverEmail;
    const participant_email2 =  receiverEmail+'-'+senderEmail;

    //const conversation = this.conversationsRepository.find(conversation => conversation.participantsEmail === participant_email1 || conversation.participantsEmail === participant_email2);
    
    const conversation : any = await this.conversationsRepository.findOne({
      where: [
        { participantsEmail: participant_email1 }, // 🛡️🛡️🛡️ we need OR logic here .. 
        { participantsEmail: participant_email2 },
      ],
      // select: ["conversationId"]
    });
    
    if(conversation){
      // console.log(" ============== previous conversation found", conversation);
       // console.log(conversation)
      const { conversationId} = conversation;
      // conversation exist 
      // add message in message table 
      const newMessageWithConversationId = {
        ...newMessage,
        conversationId : conversationId
      }

      // 🟢 ekhane  conversation table er lastMessage update korte hobe
      await this.conversationsRepository.update(conversationId, {lastMessage : message});
      
      //this.messages.push(newMessageWithConversationId);
      await this.messagesRepository.save(newMessageWithConversationId);
      return newMessageWithConversationId;
    }else{
      // console.log(" ============== conversation does not exist============ >> conversation is null" , conversation);
      // conversation does not exist 
      // create a conversation with participant_email and timeStamps

      //🟢check korte hobe sender and receiver seller and buyer database e ase kina
      const participantsAreInDBForSellerSender = await this.sellersRepository.findOne({ 
        where: [
          {sellerEmailAddress : senderEmail},
          
        ]
      });


      const participantsAreInDBForSellerReceiver = await this.sellersRepository.findOne({ 
        where: [
          {sellerEmailAddress : receiverEmail}
        ]
      });
      if(participantsAreInDBForSellerReceiver){
        againExistFlag  =true;
      }

      participantsAreInDBBBB = participantsAreInDBForSellerSender

      if(participantsAreInDBForSellerSender){
       // console.log("sender email or receiver email are in sellerRepository >>participantsAreInDB : ", participantsAreInDBBBB)
        existFlag = true;

        const participantsAreInDB =  await this.buyersRepository.findOne({ 
          where: [
            {sellerEmailAddress : senderEmail},
            {sellerEmailAddress : receiverEmail}
          ]
        });
        if(participantsAreInDB){
          againExistFlag = true;
          //console.log("sender email or receiver email are in buyerRepository ")
        }else{
          //console.log("not exist in sellerRepository or buyerRepository ")
          
        }

      }else{
        const participantsAreInDB =  await this.buyersRepository.findOne({ 
          where: [
            {sellerEmailAddress : senderEmail},
            {sellerEmailAddress : receiverEmail}
          ]
        });
        if(participantsAreInDB){
          againExistFlag = true;
          //console.log("sender email or receiver email are in buyerRepository ")
        }else{
          //console.log("not exist in sellerRepository or buyerRepository ")
        }
      }

      if(existFlag && againExistFlag){
      
            // 🟢 lets call createNewConversation service function to do that 
            const newConversation = {
              participantsEmail : participant_email1,
              lastMessage : message,
              //timeStamps : Date.now()
              timeStamps : new Date().toISOString(),
            }
            //console.log(" ============== newConversation Creation done", newConversation);
            const newCreatedConversation =  await this.createNewConversation(newConversation);
            const newlyCreatedConversationId = newCreatedConversation.conversationId;
            // console.log(newCreatedConversation, " newlyCreatedConversationIdd ======2. ",newlyCreatedConversationId);
            // jei conversatioin ta create korlam .. shetar id amar jana lagbe 

            // new message with conversation id
            const newMessageWithConversationId = {
              ...newMessage,
              conversationId : newlyCreatedConversationId
            }
          //  console.log("newMessageWithConversationId :   :: 3", newMessageWithConversationId)

            // its time to save this in message table 
            this.messagesRepository.save(newMessageWithConversationId);
            return newMessageWithConversationId;
        }else{
          //=======================================================
          // console.log("Conversation Can not created")

          // throw new HttpException(
          //   {
          //     status : HttpStatus.NOT_FOUND, // statusCode - 401
          //     error : "sender or receiver email not found.", // short description
          //   }, 
          //   HttpStatus.NOT_FOUND // 2nd argument which is status 
          //   ,
          //   // {
          //   //   //optional //provide an error cause. 
          //   //   cause : err
          //   // }
          //   );
         
        }
      }

      
      
    //😢 ekhane ki kichu return korar dorkar ase ? 
  }

  // I think done 🟢
  async createNewConversation(createConversationDto/*: CreateConversationDto */) {
    const {participantsEmail, timeStamps, sellerId, buyerId, lastMessage} = createConversationDto;
    // participantsEmail er throw te .. seller and buyer er id khuje ber korte hobe 
    // then sheta newConversation object er vitor e pass korte hobe 
    const newConversation = {
      //conversationId : Date.now(),
      conversationId : new Date().getSeconds(), //getTime() 
      participantsEmail : participantsEmail,
      timeStamps : timeStamps,
      sellerId : sellerId,
      buyerId : buyerId ,
      lastMessage : lastMessage
    }
    
    return this.conversationsRepository.save(newConversation); // eta likha e lagbe ;
    
  }
  
  async showAllConversationToCurrentLoggedInUser(currentLoggedInUserEmail : string) /*:Promise<Conversation[]>*/ {   
    
    //console.log(currentLoggedInUserEmail)
//////////////////////////////////////////////////////////////////
    // 1. current logged in user conversation er participantEmail er moddhe ase kina check korbo
    //    shei conversation gula niye ashbo 
    const conversations = await this.conversationsRepository
      .createQueryBuilder('conversation')
      .where('conversation.participantsEmail ILIKE :email', {
        email: `%${currentLoggedInUserEmail}%`,
      })
      .getMany();

    const participantsEmail = conversations.map(conversation => conversation.participantsEmail);
    const filteredParticipantsEmail1 = participantsEmail.map(participantEmail => participantEmail.replace(currentLoggedInUserEmail+'-',''));
    const filteredParticipantsEmail2 = filteredParticipantsEmail1.map(participantEmail => participantEmail.replace('-'+currentLoggedInUserEmail,''));
    

    //🟢console.log(filteredParticipantsEmail2)

    const buyers = await this.buyersRepository.find({
      select: ["sellerName", "id", "sellerEmailAddress"], // Select only the 'name' column
      where: {
        sellerEmailAddress: In(filteredParticipantsEmail2), // Match against the list of emails
      },
    });

    const sellers = await this.sellersRepository.find({
      select: ["sellerName", "id", "sellerEmailAddress"], // Select only the 'name' column
      
      where: {
        sellerEmailAddress: In(filteredParticipantsEmail2), // Match against the list of emails
      },
      
    });

    //console.log(buyers)
    //console.log(sellers)

    const lastMessageOfEachConversationWhichContainsCurrentLogginUser = conversations.map(conversation => {
      const {lastMessage, participantsEmail,conversationId} = conversation;
      //console.log(conversation.conversationId);//////////////////////////🟢🟢🟢
      const filteredParticipantsEmail = participantsEmail.replace(currentLoggedInUserEmail+'-','');
      const filteredParticipantsEmail2 = filteredParticipantsEmail.replace('-'+currentLoggedInUserEmail,'');
      const lastMessageOfEachConversation = {
        lastMessage : lastMessage,
        participantsEmail : filteredParticipantsEmail2,
        conversationId : conversationId
      }
      // console.log(lastMessageOfEachConversation)
      return lastMessageOfEachConversation;
    })

    let buyerConversation = []; 

    //🟢console.log(lastMessageOfEachConversationWhichContainsCurrentLogginUser)
    const callNewMethod = (buyer, lastMessage, conversationId) => {
     //🟢console.log("======== 1 in call new method")
      const buyerWithLastMessage = {
        ...buyer,
        lastMessage: lastMessage,
        conversationId:conversationId
      };
      buyerConversation.push(buyerWithLastMessage);
      
    }

  
    const buyersConversation  = buyers.map(buyer => {
     lastMessageOfEachConversationWhichContainsCurrentLogginUser.map(conversation => {
       //🟢console.log("======== 1 in last message of each conversation which contains current logged in user", conversation)
        if(conversation.participantsEmail == buyer.sellerEmailAddress){
          // console.log(conversation);
          //🟢console.log("======== 2")
          
          // console.log(buyer);
          // console.log(email.participantsEmail, email.lastMessage)
          callNewMethod(buyer, conversation.lastMessage, conversation.conversationId);
        }
      })
      
    });


    // 🟢 finally working .. Alhamdulillah
  // buyerConversation.map(buyer => {
  //   console.log("buyer:::::::",buyer )
  // })
    //console.log(buyersConversation)

    
////////////////////////////////////////////

    // lets do same thing for seller 
    // but first lets return that 
    // return buyerConversation;

    // well done .. 
    // lets do same thing for seller

    const sellersConversation  = sellers.map(seller => {
      lastMessageOfEachConversationWhichContainsCurrentLogginUser.map(conversation => {
        //🟢console.log("======== 1")
         if(conversation.participantsEmail == seller.sellerEmailAddress){
          //🟢 
          // console.log("======== ",conversation)
           
           // console.log(buyer);
           // console.log(email.participantsEmail, email.lastMessage)
           callNewMethod(seller, conversation.lastMessage, conversation.conversationId);
         }
       })
     });

    
  if(buyerConversation.length > 0){
    return buyerConversation;
  }else{
    
    throw new HttpException(
      {
        status : HttpStatus.NOT_FOUND, // statusCode - 401
        error : "conversation not found.", // short description
      }, 
      HttpStatus.NOT_FOUND // 2nd argument which is status 
      
      );
  }
  
    /////////////////////////////////////////////////////////////
  }

  async showAllMessageOfAConversation(conversationId){
    // ei conversation id against e message table e joto message ase .. sob gula show korbo
    // decending order e .. 🔰 timestamp er maddhome 
    
    //const AllMessage = this.messages.filter(message => message.conversationId == conversationId);
    
    

    const AllMessage = await this.messagesRepository.find({
      where: [
        { conversationId: conversationId }, // 🛡️🛡️🛡️ not sure .. 
      ]
    });

    if(AllMessage.length > 0){
      return AllMessage;
    }else{
      throw new HttpException(
        {
          status : HttpStatus.NOT_FOUND, // statusCode - 401
          error : "No message found of this conversation.", // short description
        }, 
        HttpStatus.NOT_FOUND // 2nd argument which is status 
        
        );
    }

    
  }

  async deleteConversationByConversationId(conversationId){
    console.log("in service for delete")
    return await this.conversationsRepository.delete(conversationId);
  }


  


  
}


 