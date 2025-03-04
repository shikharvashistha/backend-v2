import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class NotificationLogDto {
  @Expose()
  notificationLogId: string;
  @ApiProperty({
    description: "Content of notification",
  })
  @Expose()
  content: string;

  @ApiProperty({
    description: "Recepients of notification",
  })
  @Expose()
  recepients: [];

  @ApiProperty({
    description: "Module of notification",
  })
  @Expose()
  module: string;

  @ApiProperty({
    description: "Template content Id",
  })
  @Expose()
  templateContentId: string;

  @ApiProperty({
    description: "medium of notification",
  })
  @Expose()
  medium: string;

  @ApiProperty({
    description: "Sent date of notification",
  })
  @Expose()
  sentDate: string;

  @ApiProperty({
    description: "options of notification",
  })
  @Expose()
  options: [];

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  createdBy: string;

  @Expose()
  updatedBy: string;

  @Expose()
  templateId: string;

  constructor(obj: any) {
    this.notificationLogId = obj?.osid ? `${obj.osid}` : "";
    this.content = obj?.data.content ? `${obj.data.content}` : "";
    this.recepients = obj?.data.recepients ? obj.data.recepients : "";
    this.module = obj?.data.module ? `${obj.data.module}` : "";
    this.templateContentId = obj?.data.templateContentId
      ? `${obj.data.templateContentId}`
      : "";
    this.templateId = obj?.data.templateId ? `${obj.data.templateId}` : "";
    this.medium = obj?.data.medium ? `${obj.data.medium}` : "";
    this.sentDate = obj?.data.sentDate ? `${obj.data.sentDate}` : "";
    this.options = obj?.data.options ? obj.data.options : "";
    this.createdAt = obj?.osCreatedAt ? `${obj.osCreatedAt}` : "";
    this.updatedAt = obj?.osUpdatedAt ? `${obj.osUpdatedAt}` : "";
    this.createdBy = obj?.osCreatedBy ? `${obj.osCreatedBy}` : "";
    this.updatedBy = obj?.osUpdatedBy ? `${obj.osUpdatedBy}` : "";
  }
}
