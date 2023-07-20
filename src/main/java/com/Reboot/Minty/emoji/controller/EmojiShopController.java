package com.Reboot.Minty.emoji.controller;

import com.Reboot.Minty.emoji.entity.EmojiShop;
import com.Reboot.Minty.emoji.service.EmojiShopService;
import com.Reboot.Minty.member.entity.User;
import com.Reboot.Minty.member.repository.UserRepository;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Controller
public class EmojiShopController {

    private final EmojiShopService emojiShopService;
    private final UserRepository userRepository;
    @Autowired
    private Storage storage;
    @Autowired
    public EmojiShopController(EmojiShopService emojiShopService, UserRepository userRepository) {

        this.emojiShopService = emojiShopService;
        this.userRepository = userRepository;
    }

    @GetMapping("/emojiRegister")
    public String showRegistrationForm(Model model) {
        model.addAttribute("emojiShop", new EmojiShop());
        return "event/emojiRegister";
    }

    @GetMapping("/emojiDetail/{id}")
    public String showEmojiDetail(@PathVariable("id") Long id, HttpSession session, Model model) {
        Long userId = (Long) session.getAttribute("userId");
        User user = userRepository.findById(userId).orElseThrow(EntityNotFoundException::new);

        // EmojiShop 정보 가져오기
        EmojiShop emojiShop = emojiShopService.getEmojiShopById(id);
        model.addAttribute("emojiShop", emojiShop);

        // 이미지들을 4개씩 그룹화하여 전달
        List<List<String>> imageGroups = new ArrayList<>();
        List<String> images = emojiShop.getImages();
        for (int i = 0; i < images.size(); i += 4) {
            int endIndex = Math.min(i + 4, images.size());
            imageGroups.add(images.subList(i, endIndex));
        }
        model.addAttribute("imageGroups", imageGroups);

        // 사용자 정보 모델에 저장
        model.addAttribute("user", user);

        return "event/emojiDetail";
    }

    //    @GetMapping("/emojiDetail/{id}")
//    public String showEmojiDetail(@PathVariable("id") Long id, Model model) {
//        EmojiShop emojiShop = emojiShopService.getEmojiShopById(id);
//        model.addAttribute("emojiShop", emojiShop);
//        return "event/emojiDetail";
//    }
    @GetMapping("/emojiList")
    public String showEmojiList(Model model) {
        List<EmojiShop> emojiShops = emojiShopService.getAllEmojiShops();
        model.addAttribute("emojiShops", emojiShops);
        return "event/emojiList";
    }

    @Value("${spring.cloud.gcp.storage.credentials.bucket}")
    private String bucketName;
    @PostMapping("/emojiRegister")
    public String registerEmoticon(@ModelAttribute EmojiShop emojiShop, @RequestParam("imageFiles") List<MultipartFile> imageFiles, HttpSession session) {
        List<String> imagePaths = new ArrayList<>();
        for (MultipartFile imageFile : imageFiles) {
            if (!imageFile.isEmpty()) {
                try {
                    String uuid = UUID.randomUUID().toString();
                    String filePath = "images/" + uuid + ".jpg";
                    BlobInfo blobInfo = storage.create(
                            BlobInfo.newBuilder(bucketName, filePath)
                                    .setContentType("image/jpg")
                                    .build(),
                            imageFile.getInputStream()
                    );
                    imagePaths.add(filePath);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        emojiShop.setImages(imagePaths);
        emojiShopService.saveEmoji(emojiShop);
        return "redirect:/emojiList";
    }

}