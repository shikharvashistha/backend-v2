import { Injectable, HttpException, Param } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import axios, { AxiosResponse } from "axios";
import { map } from "rxjs";
import { SuccessResponse } from "src/success-response";
import { catchError, takeLast } from "rxjs/operators";
import { ErrorResponse } from "src/error-response";
import { NotificationLogDto } from "src/notification/dto/notification.dto";
import { NotificationSearchDto } from "src/notification/dto/notification-search.dto";
import moment from "moment";
import { GroupDto } from "src/group/dto/group.dto";
import { CronJob } from "cron";
import { SchedulerRegistry } from "@nestjs/schedule";
import jwt_decode from "jwt-decode";

@Injectable()
export class NotificationService {
  constructor(
    private httpService: HttpService,
    private schedulerRegistry: SchedulerRegistry
  ) {}
  baseURL = `${process.env.BASEAPIURL}`;
  UCIURL = `${process.env.UCIAPI}`;
  url = process.env.TEMPLATERURL;
  groupURL = `${process.env.BASEAPIURL}/Class`;

  public async instantSendNotification(
    module: any,
    eventTrigger: string,
    templateId: string,
    senderId: string,
    groupId: string,
    channel: string,
    request: any
  ) {
    var axios = require("axios");
    const result = Math.random().toString(27).substring(6, 8);
    var confi = {
      method: "get",
      url: `${this.url}${templateId}`,
      headers: {
        Authorization: request.headers.authorization,
      },
    };

    const getContent = await axios(confi);
    const contentData = getContent.data;

    // Conversation Logic
    var conversationData = {
      data: {
        name: `Shiksha ${channel} Broadcast ${result}`,
        transformers: [
          {
            id: process.env.TRANSFORMERSID,
            meta: {
              body: contentData.body,
              type: contentData.type,
              user: process.env.TRANSFORMERSUSER,
            },
            type: "broadcast",
          },
        ],
        adapter: contentData.user,
      },
    };

    const conversation = await axios.post(
      `${this.UCIURL}/conversationLogic/create`,
      conversationData,
      {
        headers: {
          "admin-token": process.env.UCIADMINTOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const resData = conversation.data;
    const consversationLogicID = resData.result.data.id;

    var data = {
      filters: {
        osid: {
          eq: groupId,
        },
      },
    };

    const responseData = await axios.post(`${this.groupURL}/search`, data, {
      headers: {
        Authorization: request.headers.authorization,
      },
    });

    const dtoResponse = responseData.data.map(
      (item: any) => new GroupDto(item)
    );

    const filterObj = dtoResponse.filter((e: any) => e);
    let option = filterObj[0].option;
    let optionStr = JSON.stringify(option);
    var jsonObj = JSON.parse(optionStr);
    let params = JSON.parse(jsonObj);
    var notificationModule = params.filter((obj: any) => obj.module === module);
    const triggers = notificationModule[0].eventTriggers;
    var notificationTrigger = triggers.filter(
      (obj: any) => obj.name === eventTrigger
    );

    var botData = {
      data: {
        startingMessage: `Hi Shiksha ${channel} Broadcast ${result}`,
        name: `Shiksha Notification Broadcast ${result}`,
        users: [notificationTrigger[0].userSegment],
        logic: [consversationLogicID],
        status: "enabled",
        startDate: moment().format("Y-MM-DD"),
        endDate: moment().format("Y-MM-DD"),
      },
    };

    const botResponse = await axios.post(`${this.UCIURL}/bot/create`, botData, {
      headers: {
        "admin-token": process.env.UCIADMINTOKEN,
        "Content-Type": "application/json",
      },
    });

    const botResData = botResponse.data;
    const botCreateID = botResData.result.data.id;

    var configs = {
      method: "get",
      url: `${process.env.BOTCALL}${botCreateID}`,
      headers: {},
    };

    const botres = await axios(configs);

    const sendData = botres.data;
    // Notification Log

    var notificationData = {
      medium: channel,
      templateId: templateId,
      recepients: [notificationTrigger[0].userSegment],
      sentDate: new Date(),
      sentBy: senderId,
      module: notificationModule[0].module,
      options: "",
      content: contentData.body,
    };

    const logRes = await axios.post(
      `${this.baseURL}Notificationlog`,
      notificationData,
      {
        headers: {
          Authorization: request.headers.authorization,
        },
      }
    );
    const logResponse = logRes.data;
    return new SuccessResponse({
      statusCode: 200,
      message: "ok.",
      data: logResponse,
    });
  }

  //Notificationschedule
  public async scheduleSendNotification(
    module: any,
    eventTrigger: string,
    templateId: string,
    senderId: string,
    groupId: string,
    channel: string,
    month: string,
    date: string,
    hours: string,
    minutes: String,
    jobName: string,
    request: any
  ) {
    var axios = require("axios");

    //content data api
    var confi = {
      method: "get",
      url: `${this.url}${templateId}`,
      headers: {
        Authorization: request.headers.authorization,
      },
    };
    const getContent = await axios(confi);
    const contentData = getContent.data;

    //params data
    var axios = require("axios");
    var data = {
      filters: {
        osid: {
          eq: groupId,
        },
      },
    };

    var getSegment = {
      method: "post",
      url: `${this.groupURL}/search`,
      headers: {
        Authorization: request.headers.authorization,
      },
      data: data,
    };
    const responseData = await axios(getSegment);

    const dtoResponse = responseData.data.map(
      (item: any) => new GroupDto(item)
    );

    const filterObj = dtoResponse.filter((e: any) => e);

    let option = filterObj[0].option;

    let optionStr = JSON.stringify(option);
    var jsonObj = JSON.parse(optionStr);
    let params = JSON.parse(jsonObj);
    var notificationModule = params.filter((obj: any) => obj.module === module);
    const triggers = notificationModule[0].eventTriggers;
    var notificationTrigger = triggers.filter(
      (obj: any) => obj.name === eventTrigger
    );

    //save notification
    let notificationScheduleData = {
      medium: channel,
      templateId: templateId,
      recepients: [notificationTrigger[0].userSegment],
      sentDate: new Date(),
      sentBy: senderId,
      module: notificationModule[0].module,
      options: "",
      content: contentData.body,
      scheduleDate: date,
      hours,
      minutes,
      month,
    };

    var logConfig = {
      method: "post",
      url: `${this.baseURL}Notificationschedule`,
      headers: {
        Authorization: request.headers.authorization,
      },
      data: notificationScheduleData,
    };

    const logRes = await axios(logConfig);
    const logResponse = logRes.data;

    //cronJob logic

    let osid = logResponse.result.Notificationschedule.osid;

    var yy = date.slice(0, 4);
    let year = parseInt(yy);

    var dd = date.slice(-2);
    let d = parseInt(dd);

    var mm = date.slice(5, 7);
    let mon = parseInt(mm);
    mon = mon - 1;

    let hrs = parseInt(hours);
    let mins = +minutes;

    let ist = new Date(year, mon, d, hrs, mins);
    let utc = moment.utc(ist).format("YYYY-MM-DD HH:mm:ss ");
    let utcMin = utc.slice(14, 16);
    let utcHrs = utc.slice(11, 13);
    let utcDay = utc.slice(8, 11);
    let utcMon = utc.slice(5, 7);

    const job = new CronJob(
      // `0 ${utcMin} ${utcHrs} ${utcDay} ${utcMon} *`,
      `0 ${mins} ${hrs} ${d} ${mon} *`,
      async () => {
        var axios = require("axios");
        const result = Math.random().toString(27).substring(6, 8);
        var conversationData = {
          data: {
            name: `Shiksha ${channel} Broadcast ${result}`,
            transformers: [
              {
                id: process.env.TRANSFORMERSID,
                meta: {
                  body: contentData.body,
                  type: contentData.type,
                  user: process.env.TRANSFORMERSUSER,
                },
                type: "broadcast",
              },
            ],
            adapter: contentData.user,
          },
        };

        const conversation = await axios.post(
          `${this.UCIURL}/conversationLogic/create`,
          conversationData,
          {
            headers: {
              "admin-token": process.env.UCIADMINTOKEN,
              "Content-Type": "application/json",
            },
          }
        );

        const resData = conversation.data;

        const consversationLogicID = resData.result.data.id;

        // Bot Logic
        var botData = {
          data: {
            startingMessage: `Hi Shiksha ${channel} Broadcast ${result}`,
            name: `Shiksha Notification Broadcast ${result}`,
            users: [notificationTrigger[0].userSegment],
            logic: [consversationLogicID],
            status: "enabled",
            startDate: moment().format("Y-MM-DD"),
            endDate: moment().format("Y-MM-DD"),
          },
        };

        const botResponse = await axios.post(
          `${this.UCIURL}/bot/create`,
          botData,
          {
            headers: {
              "admin-token": process.env.UCIADMINTOKEN,
              "Content-Type": "application/json",
            },
          }
        );
        const botResData = botResponse.data;
        const botCreateID = botResData.result.data.id;

        var configs = {
          method: "get",
          url: `${process.env.BOTCALL}${botCreateID}`,
          headers: {},
        };
        const botres = await axios(configs);

        const sendData = botres.data;
        // Notification Log

        var notificationData = {
          medium: channel,
          templateId: templateId,
          recepients: [notificationTrigger[0].userSegment],
          sentDate: new Date(),
          sentBy: senderId,
          module: module,
          options: "",
          content: contentData.body,
          scheduleDate: date,
          hours,
          minutes,
          month,
        };
        const logRes = await axios.post(
          `${this.baseURL}Notificationlog`,
          notificationData,
          {
            headers: {
              Authorization: request.headers.authorization,
            },
          }
        );
        const logResponse = logRes.data;

        var deleteCron = {
          method: "delete",
          url: `${this.baseURL}Notificationschedule/${osid}`,
          headers: {
            Authorization: request.headers.authorization,
          },
        };
        const deletedNotification = await axios(deleteCron);

        job.stop();
      }
    );

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();

    return `SMS set for EOD at ${hours}:${minutes} `;
  }

  public async getNotification(notificationId: string, request: any) {
    return this.httpService
      .get(`${this.baseURL}/Notificationlog/${notificationId}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          let notificationData = axiosResponse.data;
          const templateDto = new NotificationLogDto(notificationData);

          return new SuccessResponse({
            statusCode: 200,
            message: "ok.",
            data: templateDto,
          });
        }),
        catchError((e) => {
          var error = new ErrorResponse({
            errorCode: e.response?.status,
            errorMessage: e.response?.data?.params?.errmsg,
          });
          throw new HttpException(error, e.response.status);
        })
      );
  }

  public async searchNotification(
    request: any,
    notificationSearchDto: NotificationSearchDto
  ) {
    return this.httpService
      .post(`${this.baseURL}/Notificationlog/search`, notificationSearchDto, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(
        map((response) => {
          const responsedata = response.data.map(
            (item: any) => new NotificationLogDto(item)
          );

          return new SuccessResponse({
            statusCode: response.status,
            message: "Ok.",
            data: responsedata,
          });
        }),
        catchError((e) => {
          var error = new ErrorResponse({
            errorCode: e.response.status,
            errorMessage: e.response.data.params.errmsg,
          });
          throw new HttpException(error, e.response.status);
        })
      );
  }

  //schedule
  public async searchSchedulehNotification(
    request: any,
    notificationSearchDto: NotificationSearchDto
  ) {
    return this.httpService
      .post(
        `${this.baseURL}/Notificationschedule/search`,
        notificationSearchDto,
        {
          headers: {
            Authorization: request.headers.authorization,
          },
        }
      )
      .pipe(
        map((response) => {
          const responsedata = response.data.map(
            (item: any) => new NotificationLogDto(item)
          );

          return new SuccessResponse({
            statusCode: response.status,
            message: "Ok.",
            data: responsedata,
          });
        }),
        catchError((e) => {
          var error = new ErrorResponse({
            errorCode: e.response.status,
            errorMessage: e.response.data.params.errmsg,
          });
          throw new HttpException(error, e.response.status);
        })
      );
  }

  public async getScheduleNotification(
    ScheduleNotificationid: string,
    request: any
  ) {
    return this.httpService
      .get(`${this.baseURL}/Notificationschedule/${ScheduleNotificationid}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          let scheduleNotificationData = axiosResponse.data;
          const templateDto = new NotificationLogDto(scheduleNotificationData);

          return new SuccessResponse({
            statusCode: 200,
            message: "ok.",
            data: templateDto,
          });
        }),
        catchError((e) => {
          var error = new ErrorResponse({
            errorCode: e.response?.status,
            errorMessage: e.response?.data?.params?.errmsg,
          });
          throw new HttpException(error, e.response.status);
        })
      );
  }
}
