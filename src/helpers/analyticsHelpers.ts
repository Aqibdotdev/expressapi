import redisClient from "../connections/redisConnect";

export const logAnalytics = async (
  endpointName: string,
  createdBy?: string
) => {
  try {
    const count =
      Number(await redisClient.get(`analytics-${endpointName}-${createdBy}`)) ||
      0;

    await redisClient.set(`analytics-${endpointName}-${createdBy}`, count + 1);

    console.log(`analytics-${endpointName}-${createdBy}: `, count);
  } catch (err) {
    console.log({ err });
  }
};
