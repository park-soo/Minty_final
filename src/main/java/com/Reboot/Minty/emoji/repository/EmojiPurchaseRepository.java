package com.Reboot.Minty.emoji.repository;

import com.Reboot.Minty.emoji.entity.EmojiPurchase;
import com.Reboot.Minty.emoji.entity.EmojiShop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmojiPurchaseRepository extends JpaRepository<EmojiPurchase, Long> {
    boolean existsByEmojiIdAndBuyerId(EmojiShop emojiShop, Long buyerId);

    List<EmojiPurchase> findByBuyerId(Long buyerId);

}

