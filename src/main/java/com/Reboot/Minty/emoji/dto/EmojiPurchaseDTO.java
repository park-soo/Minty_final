package com.Reboot.Minty.emoji.dto;

import com.Reboot.Minty.emoji.entity.EmojiShop;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class EmojiPurchaseDTO {
    private Long emojiId;
    private Long buyerId;
    private int price;
}
