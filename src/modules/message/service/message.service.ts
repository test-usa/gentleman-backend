import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Message, { MessageType } from '../entity/message.entity';
import { Repository } from 'typeorm';
import ApiError from 'src/common/errors/ApiError';
import { CreateMessageDto } from '../dto/create-message.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { OfferMessege } from '../entity/offerMessage.entity';

@Injectable()
export class MessageService {

    constructor(
        @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
        @InjectRepository(OfferMessege) private readonly offerMessageRepository: Repository<OfferMessege>,
        private readonly cloudinary: CloudinaryService
    ) { }

    async getAllPrivateMessages(user, receiver_id, paginationDto) {
        const { page = 1, limit = 20 } = paginationDto;

        const [messages, total] = await this.messageRepository.findAndCount({
            where: [
                { sender: { id: user.userId }, receiver: { id: receiver_id } },
                { sender: { id: receiver_id }, receiver: { id: user.userId } },
            ],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: {
                offerMessage: true
            },
        });
        if (messages.length === 0) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'No messages found!');
        }


        const data = messages.map((msg) => {
            const sender = {
                name: msg.sender.name,
                email: msg.sender.email,
                role: msg.sender.role,
                profileImage: msg.sender.profileImage
            }
            const receiver = {
                id: msg.receiver.id,
                name: msg.receiver.name,
                email: msg.receiver.email,
                role: msg.receiver.role,
                profileImage: msg.receiver.profileImage
            }
            let message = { ...msg, sender, receiver };
            return message;
        })

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async createMessage(user, payload: CreateMessageDto, files?: Express.Multer.File[]) {
        const message = await this.messageRepository.create();

        if (files && files.length > 0 && payload.type === MessageType.FILE) {
            const fileUrls = await Promise.all(
                files.map(async (file, index) => {
                    const result = await this.cloudinary.uploadFile(file, 'attachments');
                    return result['secure_url'];
                })
            )

            message.fileUrls = fileUrls;
            message.fileNames = files.map((file, index) => file.originalname);

        } else if (payload.type === MessageType.OFFER) {
            const offerMessage = await this.offerMessageRepository.create()
            offerMessage.description = payload.description as string;
            offerMessage.offerPrice = Number(payload.offerPrice);

            const res = await this.offerMessageRepository.save(offerMessage);
            message.offerMessage = res;
        }

        message.receiver = payload.receiver;
        message.type = payload.type;
        message.sender = user.userId;
        message.content = payload.content ? String(payload.content) : '';


        const data = await this.messageRepository.save(message);

        return data;
    }

    async update(user, payload, id) {
        const msg = await this.messageRepository.findOneBy({ id });
        if (!msg) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Message not exist!')
        }
        if (msg.sender.id != user.userId) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Don\'t have permission to update!')
        }
        let offerMessage: null | OfferMessege = null;
        if (msg.type === MessageType.OFFER) {
            const offerMsg = await this.offerMessageRepository.findOneBy({ id: msg.offerMessage.id });
            if (!offerMsg) {
                throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong!");
            }
            offerMsg.description = payload.description ? payload.description : offerMsg.description;
            offerMsg.offerPrice = payload.offerPrice ? Number(payload.offerPrice) : offerMsg.offerPrice;
            offerMessage = await this.offerMessageRepository.save(offerMsg);
        }

        if (msg.type === MessageType.FILE) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'File message can not update!');
        }

        msg.content = payload.content ? payload.content : msg.content;

        const updatedMsg = await this.messageRepository.save(msg);

        updatedMsg.offerMessage = offerMessage ? offerMessage : msg.offerMessage;

        const sender = {
            name: msg.sender.name,
            email: msg.sender.email,
            role: msg.sender.role,
            profileImage: msg.sender.profileImage
        }
        const receiver = {
            id: msg.receiver.id,
            name: msg.receiver.name,
            email: msg.receiver.email,
            role: msg.receiver.role,
            profileImage: msg.receiver.profileImage
        }

        const customData = { ...updatedMsg, sender, receiver }
        return {
            updated_message: customData
        }
    }

    async destroy(user, id) {
        const msg = await this.messageRepository.findOneBy({ id });
        if (!msg) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Message not exist!')
        }
        if (msg.sender.id != user.userId) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Message can\'t be deleted!')
        }

        if (msg.offerMessage) {
            const offerMsg = await this.offerMessageRepository.findOneBy({ id: msg.offerMessage.id })
            await this.offerMessageRepository.remove(offerMsg as OfferMessege);
        }

        if (msg.type === MessageType.FILE && msg.fileUrls && msg.fileUrls.length > 0) {
            await Promise.all(
                msg.fileUrls.map(async (url: string) => {
                    const publicId = this.cloudinary.extractPublicId(url);
                    await this.cloudinary.destroyFile(String(publicId));
                })
            )
        }

        await this.messageRepository.remove(msg);

        return {
            delete_message_id: id
        };
    }

}
