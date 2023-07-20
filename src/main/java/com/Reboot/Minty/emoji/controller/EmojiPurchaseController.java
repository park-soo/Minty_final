package com.Reboot.Minty.emoji.controller;

import com.Reboot.Minty.emoji.dto.EmojiPurchaseDTO;
import com.Reboot.Minty.emoji.entity.EmojiPurchase;
import com.Reboot.Minty.emoji.entity.EmojiShop;
import com.Reboot.Minty.emoji.service.EmojiPurchaseService;
import com.Reboot.Minty.member.entity.User;
import com.Reboot.Minty.member.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class EmojiPurchaseController {
    private final EmojiPurchaseService emojiPurchaseService;
    private final UserRepository userRepository;

    @Autowired
    public EmojiPurchaseController(EmojiPurchaseService emojiPurchaseService, UserRepository userRepository) {
        this.emojiPurchaseService = emojiPurchaseService;
        this.userRepository = userRepository;
    }

    @PostMapping("/emoji-purchase")
    public ResponseEntity<String> createEmojiPurchase(@RequestBody EmojiPurchaseDTO emojiPurchaseDTO, HttpSession session, Model model) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found in session.");
            }

            User buyer = userRepository.findById(userId).orElseThrow(EntityNotFoundException::new);
            emojiPurchaseDTO.setBuyerId(buyer.getId());

            boolean purchaseSuccess = emojiPurchaseService.createEmojiPurchase(emojiPurchaseDTO);
            if (purchaseSuccess) {
                System.out.println("구매가 완료되었습니다.");
                List<EmojiShop> purchasedEmojis = emojiPurchaseService.getPurchasedEmojisByUser(userId);
                model.addAttribute("purchasedEmojis", purchasedEmojis);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("INSUFFICIENT_POINTS");
            }
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("구매에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ALREADY_PURCHASED");
        }
    }




}
