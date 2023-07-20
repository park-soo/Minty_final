package com.Reboot.Minty.member.controller;


import com.Reboot.Minty.emoji.entity.EmojiPurchase;
import com.Reboot.Minty.emoji.entity.EmojiShop;
import com.Reboot.Minty.emoji.service.EmojiPurchaseService;
import com.Reboot.Minty.emoji.service.EmojiShopService;
import com.Reboot.Minty.event.service.AttendanceService;
import com.Reboot.Minty.member.entity.User;
import com.Reboot.Minty.member.repository.UserRepository;
import com.Reboot.Minty.member.service.UserService;
import com.Reboot.Minty.review.entity.Review;
import com.Reboot.Minty.review.service.ReviewService;
import com.Reboot.Minty.trade.entity.Schedule;
import com.Reboot.Minty.trade.entity.ScheduleDay;
import com.Reboot.Minty.trade.entity.ScheduleDuration;
import com.Reboot.Minty.trade.entity.Trade;
import com.Reboot.Minty.trade.repository.TradeRepository;
import com.Reboot.Minty.trade.service.ScheduleListService;
import com.Reboot.Minty.trade.service.ScheduleService;
import com.Reboot.Minty.trade.service.TradeService;
import com.Reboot.Minty.tradeBoard.dto.TradeBoardDto;
import com.Reboot.Minty.tradeBoard.service.TradeBoardService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class MyPageController {

    private  final AttendanceService attendanceService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ReviewService reviewService;
    private final TradeService tradeService;
    private final TradeRepository tradeRepository;
    private final ScheduleService scheduleService;
    private final ScheduleListService scheduleListService;
    private final TradeBoardService tradeBoardService;
    private final EmojiPurchaseService emojiPurchaseService;
    private final EmojiShopService emojiShopService;


    @Autowired
    public MyPageController(AttendanceService attendanceService, UserRepository userRepository, UserService userService, ReviewService reviewService, TradeService tradeService, TradeRepository tradeRepository, ScheduleService scheduleService, ScheduleListService scheduleListService, TradeBoardService tradeBoardService, EmojiPurchaseService emojiPurchaseService, EmojiShopService emojiShopService) {
        this.attendanceService = attendanceService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.reviewService = reviewService;
        this.tradeService = tradeService;
        this.tradeRepository = tradeRepository;
        this.scheduleService = scheduleService;
        this.scheduleListService = scheduleListService;
        this.tradeBoardService = tradeBoardService;
        this.emojiPurchaseService = emojiPurchaseService;
        this.emojiShopService = emojiShopService;
    }

    @GetMapping("mypage")
    public String showMyPage(Model model, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        User user = userRepository.findById(userId).orElseThrow(EntityNotFoundException::new);
        System.out.println(user.getNickName());

        if (user != null) {
            model.addAttribute("user", user);
        } else {
            model.addAttribute("errorMessage", "회원 정보를 찾을 수 없습니다.");
        }

        List<Review> myReviews = reviewService.getReviewsByWriterIdOrderByWriteTimeDesc(user);
        model.addAttribute("myReviews", myReviews);

        List<Review> receivedReviews = reviewService.getReceivedReviewsByReceiverIdOrderByWriteTimeDesc(user);
        model.addAttribute("receivedReviews", receivedReviews);

        double averageRating = reviewService.calculateAverageRating(receivedReviews);
        model.addAttribute("averageRating", averageRating);

        List<Trade> trades = tradeService.getTradeList(userId);
        List<User> users = tradeService.getTradeUsers(trades, userId);

        List<EmojiShop> purchasedEmojis = emojiPurchaseService.getPurchasedEmojisByUser(userId);
        model.addAttribute("purchasedEmojis", purchasedEmojis);

        EmojiShop emojiShop = emojiShopService.getEmojiShopById(userId);
        model.addAttribute("emojiShop", emojiShop);
        model.addAttribute("trades", trades);
        model.addAttribute("users", users);

        Schedule schedule = scheduleService.getSchedule(user);
        ScheduleDay scheduleDay = scheduleListService.getScheduleDay(user);
        List<ScheduleDuration> scheduleDuration = scheduleListService.getScheduleDuration(user);
        List<Trade> userTrades = tradeRepository.findByBuyerId_Id(userId);
        userTrades.addAll(tradeRepository.findBySellerId_Id(userId));


        boolean checkDay = false;
        boolean checkArea = false;
        boolean checkDuration = true;
        boolean checkIntroduction = false;

        if (schedule != null) {
            checkIntroduction = scheduleService.checkIntroduction(schedule);
        }

        checkDay = scheduleService.checkDay(user);
        checkDuration = scheduleService.checkDuration(user);

        LocalDate currentDate = LocalDate.now();
        LocalTime currentTime = LocalTime.now();
        LocalDateTime currentDateTime = LocalDateTime.of(currentDate, currentTime);
        userTrades = userTrades.stream()
                .filter(trade -> {
                    LocalDate tradeDate = trade.getTradeDate();
                    LocalTime tradeTime = trade.getTradeTime();
                    if (tradeDate == null || tradeTime == null) {
                        return false; // 거래일 또는 거래시간이 null인 경우에는 false를 반환하여 조회 제한
                    }
                    LocalDateTime tradeDateTime = LocalDateTime.of(tradeDate, tradeTime);
                    return tradeDateTime.isAfter(currentDateTime);
                })
                .collect(Collectors.toList());

        List<TradeBoardDto> filteredTradeBoards = tradeBoardService.getTradeBoardListByUser(userId);


        model.addAttribute("filteredTradeBoards", filteredTradeBoards);
        model.addAttribute("userTrades", userTrades);

        model.addAttribute("user", user);
        model.addAttribute("schedule", schedule);
        model.addAttribute("checkDay", checkDay);
        model.addAttribute("checkDuration", checkDuration);
        model.addAttribute("checkIntroduction", checkIntroduction);

        model.addAttribute("scheduleDay", scheduleDay);  // Schedule 엔티티의 day 필드
        model.addAttribute("scheduleDuration", scheduleDuration);  // Schedule 엔티티의 duration 필드

        return "member/myPage";
    }
    @GetMapping("/event")
    public String showEventForm(){
        return "event/event";
    }
}