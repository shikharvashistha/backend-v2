import { Injectable, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { map } from "rxjs";
import { AttendanceDto } from "src/attendance/dto/attendance.dto";
import { SuccessResponse } from "src/success-response";
import { ErrorResponse } from "src/error-response";
import { catchError } from "rxjs/operators";
import { AttendanceSearchDto } from "src/attendance/dto/attendance-search.dto";
import { SegmentDto } from "src/common-dto/userSegment.dto";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import moment from "moment";
@Injectable()
export class AttendanceService {
  constructor(
    private httpService: HttpService,
    private schedulerRegistry: SchedulerRegistry
  ) {}
  url = `${process.env.BASEAPIURL}/Attendance`;
  studentAPIUrl = `${process.env.BASEAPIURL}/Student`;

  public async getAttendance(attendanceId: any, request: any) {
    return this.httpService
      .get(`${this.url}/${attendanceId}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          const data = axiosResponse.data;
          const attendanceDto = new AttendanceDto(data);
          return new SuccessResponse({
            statusCode: 200,
            message: "ok.",
            data: attendanceDto,
          });
        })
      );
  }
  public async createAttendance(request: any, attendanceDto: AttendanceDto) {
    return this.httpService
      .post(`${this.url}`, attendanceDto, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return new SuccessResponse({
            statusCode: 200,
            message: "Ok.",
            data: axiosResponse.data,
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

  public async updateAttendance(
    attendanceId: string,
    request: any,
    attendanceDto: AttendanceDto
  ) {
    var axios = require("axios");
    var data = attendanceDto;

    var config = {
      method: "put",
      url: `${this.url}/${attendanceId}`,
      headers: {
        Authorization: request.headers.authorization,
      },
      data: data,
    };
    const response = await axios(config);
    return new SuccessResponse({
      statusCode: 200,
      message: " Ok.",
      data: response.data,
    });
  }

  public async searchAttendance(
    request: any,
    attendanceSearchDto: AttendanceSearchDto
  ) {
    return this.httpService
      .post(`${this.url}/search`, attendanceSearchDto, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(
        map((response) => {
          const responsedata = response.data.map(
            (item: any) => new AttendanceDto(item)
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

  public async userSegment(attendance: string, date: string, request: any) {
    let axios = require("axios");

    let data: any = {
      filters: {
        attendance: {
          eq: `${attendance}`,
        },
      },
    };
    switch (date) {
      case "today":
        data.filters = {
          ...data.filters,
          attendanceDate: {
            eq: `${moment().format("Y-MM-DD")}`,
          },
        };
        break;

      case "yesterday":
        data.filters = {
          ...data.filters,
          attendanceDate: {
            eq: `${moment().add(-1, "days").format("Y-MM-DD")}`,
          },
        };
        break;

      case "thisweek":
        data.filters = {
          ...data.filters,
          attendanceDate: {
            between: [
              moment().startOf("week").format("Y-MM-DD"),
              moment().endOf("week").format("Y-MM-DD"),
            ],
          },
        };
        break;

      case "lastweek":
        data.filters = {
          ...data.filters,
          attendanceDate: {
            between: [
              moment()
                .subtract(1, "weeks")
                .startOf("week")
                .format("YYYY-MM-DD"),
              moment().subtract(1, "weeks").endOf("week").format("YYYY-MM-DD"),
            ],
          },
        };

        break;

      case "thismonth":
        data.filters = {
          ...data.filters,
          attendanceDate: {
            between: [
              moment().startOf("month").format("Y-MM-DD"),
              moment().endOf("month").format("Y-MM-DD"),
            ],
          },
        };
        break;

      case "lastmonth":
        data.filters = {
          ...data.filters,
          attendanceDate: {
            between: [
              moment()
                .subtract(1, "months")
                .startOf("month")
                .format("YYYY-MM-DD"),
              moment()
                .subtract(1, "months")
                .endOf("month")
                .format("YYYY-MM-DD"),
            ],
          },
        };

        break;
    }

    let config = {
      method: "post",
      url: `${this.url}/search`,

      data: data,
    };

    const response = await axios(config);
    let resData = response?.data;

    let arrayIds = resData.map((e: any) => {
      return e.userId;
    });
    let studentArray = [];
    for (let value of arrayIds) {
      let config = {
        method: "get",
        url: `${this.studentAPIUrl}/${value}`,
      };
      const response = await axios(config);
      const data = response?.data;
      let studentDto = new SegmentDto(data);

      studentArray.push(studentDto);
    }
    return new SuccessResponse({
      data: studentArray,
    });
  }

  public async attendanceFilter(
    fromDate: string,
    toDate: string,
    userId: string,
    userType: string,
    attendance: string,
    groupId: string,
    schoolId: string,
    eventId: string,
    topicId: string,
    request: any
  ) {
    let axios = require("axios");
    let filters = {
      fromDate,
      toDate,
      userId,
      userType,
      attendance,
      groupId,
      schoolId,
      eventId,
      topicId,
    };
    const filterArray = Object.keys(filters).filter(
      (value, key) => filters[value] && filters[value] !== ""
    );
    let data = { attendanceDate: { between: [] } };
    filterArray.forEach((value, key) => {
      if (["fromDate", "toDate"].includes(value)) {
        data["attendanceDate"].between.push(filters[value]);
      } else {
        data[value] = { eq: filters[value] };
      }
    });

    let config = {
      method: "post",
      url: `${this.url}/search`,
      headers: {
        Authorization: request.headers.authorization,
      },
      data: { filters: data },
    };

    const response = await axios(config);

    let result =
      response?.data &&
      response.data.map((item: any) => new AttendanceDto(item));

    return new SuccessResponse({
      statusCode: 200,
      message: "ok",
      data: result,
    });
  }
  @Cron("0 10 15 * * 1-5")
  async sendSMSNotificaiotns() {
    console.log("sending SMS notification");
  }
}
