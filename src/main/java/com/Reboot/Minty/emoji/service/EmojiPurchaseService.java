package com.Reboot.Minty.emoji.service;

import com.Reboot.Minty.emoji.dto.EmojiPurchaseDTO;
import com.Reboot.Minty.emoji.entity.EmojiPurchase;
import com.Reboot.Minty.emoji.entity.EmojiShop;
import com.Reboot.Minty.emoji.repository.EmojiPurchaseRepository;
import com.Reboot.Minty.emoji.repository.EmojiShopRepository;
import com.Reboot.Minty.member.entity.User;
import com.Reboot.Minty.member.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EmojiPurchaseService {
    private final EmojiPurchaseRepository emojiPurchaseRepository;
    private final EmojiShopRepository emojiShopRepository;
    private final UserRepository userRepository;

    @Autowired
    public EmojiPurchaseService(EmojiPurchaseRepository emojiPurchaseRepository, EmojiShopRepository emojiShopRepository, UserRepository userRepository) {
        this.emojiPurchaseRepository = emojiPurchaseRepository;
        this.emojiShopRepository = emojiShopRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public boolean createEmojiPurchase(EmojiPurchaseDTO emojiPurchaseDTO) {
        Long emojiId = emojiPurchaseDTO.getEmojiId();
        int price = emojiPurchaseDTO.getPrice();

        // EmojiShop 조회
        EmojiShop emojiShop = emojiShopRepository.findById(emojiId).orElse(null);
        if (emojiShop == null) {
            throw new IllegalArgumentException("Invalid emojiId: " + emojiId);
        }

        // User 조회
        Long buyerId = emojiPurchaseDTO.getBuyerId();
        User user = userRepository.findById(buyerId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("Invalid buyerId");
        }
        boolean alreadyPurchased = emojiPurchaseRepository.existsByEmojiIdAndBuyerId(emojiShop, user.getId());
        if (alreadyPurchased) {
            throw new IllegalStateException("Emoji is already purchased by the user.");
        }
        // 구매 조건 확인
        if (user.getPoint() >= price) {
            System.out.println(user.getPoint());
            // 구매 가능한 경우
            // 포인트 차감
            user.setPoint(user.getPoint() - price);
            userRepository.save(user);

            // 구매 내역 저장
            EmojiPurchase emojiPurchase = new EmojiPurchase();
            emojiPurchase.setEmojiId(emojiShop);
            emojiPurchase.setBuyerId(user.getId());
            emojiPurchase.setPrice(price);
            emojiPurchaseRepository.save(emojiPurchase);

            return true;
        } else {
            // 포인트 부족으로 구매 불가능한 경우
            return false;
        }
    }
    public List<EmojiShop> getPurchasedEmojisByUser(Long userId) {
        List<EmojiShop> purchasedEmojis = new ArrayList<>();
        List<EmojiPurchase> emojiPurchases = emojiPurchaseRepository.findByBuyerId(userId);

        for (EmojiPurchase emojiPurchase : emojiPurchases) {
            EmojiShop emojiShop = emojiPurchase.getEmojiId();
            purchasedEmojis.add(emojiShop);
        }

        return purchasedEmojis;
    }


}
