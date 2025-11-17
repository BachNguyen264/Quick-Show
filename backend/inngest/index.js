import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.create(userData)
    }
)

//Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-with-clerk'},
    {event: 'clerk/user.deleted'},
    async ({event}) => {
        const {id} = event.data
        await User.findByIdAndDelete(id)
    }
)

//Inngest function to update user data in database
const syncUserUpdate = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData)   
    }
)

//Inngest function to cancel booking to release seats of show after 10 min of 
//booking created if payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id: 'release-seats-delete-booking'},
    {event: 'app/checkpayment'},
    async ({event, step})=>{
        const tenMinutesLater = new Date(Date.now()+ 10*60*1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);
        await step.run('check-payment-status', async ()=>{
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);

            //if payment is not made, release seats and delete booking
            if(!booking.isPaid){
                const show = await Show.findById(booking.show);
                booking.bookedSeats.forEach((seat)=>{
                    delete show.occupiedSeats[seat]
                })
                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)

//Inngest function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
    {id: "send-booking-confirmation-email"},
    {event: "app/show.booked"},
    async({event})=>{
        const {bookingId} = event.data;
        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: {path: "movie", model: 'Movie'}
        }).populate('user');

        await sendEmail({
            to: booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
            body: ` 
            <body class="body" style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #132437;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-repeat: no-repeat; background-position: center top; color: #000000; background-image: url('https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4011/blue-glow_3.jpg'); width: 600px; margin: 0 auto;" width="600">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="padding-bottom:35px;padding-left:30px;padding-right:30px;padding-top:35px;width:100%;">
																<div class="alignment" align="center">
																	<div style="max-width: 150px;"><img src="https://e0b88ae515.imgdist.com/pub/bfra/ykupnk4g/8uo/fr2/6ql/logo.svg" style="display: block; height: auto; border: 0; width: 100%;" width="150" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
													<table class="image_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center">
																	<div class="fullWidth" style="max-width: 600px;"><img src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4011/top-rounded.png" style="display: block; height: auto; border: 0; width: 100%;" width="600" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #132437;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-position: center top; color: #000000; background-color: #ffffff; width: 600px; margin: 0 auto;" width="600">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 10px; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="padding-bottom:5px;padding-left:20px;padding-right:20px;padding-top:5px;width:100%;">
																<div class="alignment" align="center">
																	<div style="max-width: 541px;"><img src="https://image.tmdb.org/t/p/original/${booking.show.movie.backdrop_path}" style="display: block; height: auto; border: 0; width: 100%;" width="541" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f84565;  background: linear-gradient(to top, #f84565, #ffffff);  background-repeat: no-repeat;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 600px; margin: 0 auto;" width="600">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="padding-bottom:5px;padding-top:25px;text-align:center;width:100%;">
																<h1 style="margin: 0; color: #555555; direction: ltr; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 36px; font-weight: normal; letter-spacing: normal; line-height: 1.2; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 43px;"><strong>Your booking for "${booking.show.movie.title}" is confirmed</strong></h1>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:20px;padding-left:15px;padding-right:15px;padding-top:20px;">
																<div style="color:#737487;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;font-size:18px;line-height:1.8;text-align:center;mso-line-height-alt:32px;">
																	<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;"><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US',{ timeZone:'Asisa/Kolkata'})} </span></p>
																	<p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;"><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US',{ timeZone:'Asisa/Kolkata'})}</span></p>
																</div>
															</td>
														</tr>
													</table>
													<table class="button_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="padding-bottom:20px;padding-left:15px;padding-right:15px;padding-top:20px;text-align:center;">
																<div class="alignment" align="center">
                                                                    <span class="button" style="background-color: #f84565; mso-shading: transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; border-radius: 4px; border-right: 0px solid transparent; border-top: 0px solid transparent; color: #ffffff; display: inline-block; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 16px; font-weight: undefined; mso-border-alt: none; padding-bottom: 10px; padding-top: 10px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word; line-height: 32px;">Enjoy the show!🍿</span></span></div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f84565;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-position: center top; color: #000000; width: 600px; margin: 0 auto;" width="600">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center">
																	<div class="fullWidth" style="max-width: 600px;"><img src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4011/bottom-rounded.png" style="display: block; height: auto; border: 0; width: 100%;" width="600" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
													<table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:30px;">
																<div style="font-family: sans-serif">
																	<div class style="font-size: 12px; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; mso-line-height-alt: 14.399999999999999px; color: #262b30; line-height: 1.2;">
																		<p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 16.8px;"><span style="word-break: break-word; font-size: 12px;">© 2025 KMA | 141 Chien Thang, Tan Trieu, Thanh Tri, Ha Noi</span></p>
																	</div>
																</div>
															</td>
														</tr>
													</table>
													<table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:35px;padding-left:10px;padding-right:10px;padding-top:5px;">
																<div style="font-family: sans-serif">
																	<div class style="font-size: 12px; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; mso-line-height-alt: 14.399999999999999px; color: #262b30; line-height: 1.2;">
																		<p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 16.8px;"><span style="word-break: break-word; font-size: 12px;">Thank you for booking with us! -- The QuickShow Team.</span></p>
																	</div>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
</body>   
            `
        })
    }
)

//Inngest function to send reminders (NEED TO REFACTOR)
const sendShowReminders = inngest.createFunction(
	{id: "send-show-reminders"},
	{cron: "0 */8 * * *"}, //every 8 hours
	async({ step })=>{
		const now = new Date();
		const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
		const windowStart = new Date(in8Hours.getTime() - 10*60*1000);

		//Prepare reminder tasks
		const reminderTasks = await step.run("prepare-reminder-tasks", async()=>{
			const shows = await Show.find({
				showDateTime: { $gte: windowStart, $lte: in8Hours}
			}).populate('movie');
			
			const tasks = [];
			for(const show of shows){
				if(!show.movie || !show.occupiedSeats) continue;
				const userIds = [...new Set(Object.values(show.occupiedSeats))]
				if(userIds.length === 0) continue;
				const users = await User.find({_id: {$in: userIds}}).select("name email");
				for(const user of users){
					tasks.push({
						userEmail: user.email,
						userName: user.name,
						movieTitle: show.movie.title,
						showTime: show.showDateTime,
					})	
				}
			}
			return tasks;
		})
		if(reminderTasks.length === 0){
			return {sent: 0, message: "No reminders to send."}
		}
		//Send reminder emails
		const results = await step.run('send-all-reminders', async ()=>{
			return await Promise.allSettled(
				reminderTasks.map( task => sendEmail({
					to: task.userEmail,
					subject:`Reminder: Your movie "${task.movieTitle}" starts soon!`,
					body: `
					<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
						<h2>Hello ${task.userName},</h2>
						<p>This is a quick reminder that your movie:</p>
						<h3 style="color: #f84565;">"${task.movieTitle}"</h3>
						<p>
						is scheduled for <strong>${new Date(task.showTime).toLocaleDateString('en-US',{timeZone: 'Asia/Kolkata'})}</strong>
						at <strong>${new Date(task.showTime).toLocaleTimeString('en-US',{timeZone: 'Asia/Kolkata'})}</strong>
						</p>
						<p>It starts in approximately <strong>8 hours</strong>
						- make sure you're ready!</p>
						<br/>
						<p>Enjoy the show!<br/>QuickShow Team</p>
					</div>
					`
				}))
			)
		})
		const sent = results.filter(r => r.status === "fulfilled").length;
		const failed = results.length - sent;
		return {
			sent,
			failed,
			message: `Send ${sent} reminder(s), ${failed} failed.`
		}
	}
)

//Inngest function to send notification when a new show is added
const sendNewShowNotifications = inngest.createFunction(
	{id: "send-new-show-notifications"},
	{event: "app/show.added"},
	async({event})=>{
		const {movieTitle} = event.data;
		const users = await User.find({});
		for(const user of users){
			const userEmail = user.email;
			const userName = user.name;
			const subject = `🎬 New Show Added: ${movieTitle}`;
			const body = `
			<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
				<h2>Hi ${userName},</h2>
				<p>We've just added a new show to our library:</p>
				<h3 style="color: #f84565;">"${movieTitle}"</h3>
				<p>Visit our website</p>
				<br/>
				<p>Thanks,<br/>QuickShow Team</p>
			</div>
			`;
			await sendEmail({
				to: userEmail,
				subject,
				body
			});
		}
		return {message: "Notifications sent."}
	}
)

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdate,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail,
	sendShowReminders,
	sendNewShowNotifications
];
